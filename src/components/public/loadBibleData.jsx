import { useState } from "react";
import { supabase } from "../../../supabaseClient";
import { getTestamentId } from "../../utlis/bibleBooks";

const BATCH_SIZE = 1000; // Increased batch size since we're handling fewer fields

const LoadBibleData = ({ bibleVersionId }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    // Optimized books processing - only essential fields
    const processBooksInBulk = async (uniqueBooks) => {
        const booksToInsert = uniqueBooks.map((book, index) => ({
            name: book,
            bible_version_id: bibleVersionId,
            testament_id: getTestamentId(book),
            order_in_version: index,
            abbreviation: book.substring(0, 3).toUpperCase(), // Simple abbreviation
        }));

        const { data: books, error } = await supabase
            .from("books")
            .upsert(booksToInsert, {
                onConflict: ["name", "bible_version_id"],
                returning: ["id", "name"]
            }).select();

        console.log(books)
        if (error) throw error;
        return books.reduce((acc, book) => {
            acc[book.name] = book.id;
            return acc;
        }, {});
    };

    // Optimized chapters processing
    const processChaptersInBulk = async (chaptersData, booksMap) => {
        const chaptersToInsert = chaptersData.map(({ book, chapter, verseCount }) => ({
            book_id: booksMap[book],
            chapter_number: parseInt(chapter, 10),
            verse_count: verseCount
        }));

        const { data: chapters, error } = await supabase
            .from("chapters")
            .upsert(chaptersToInsert, {
                onConflict: ["book_id", "chapter_number"],
                returning: ["id", "book_id", "chapter_number"]
            }).select();

        if (error) throw error;
        return chapters.reduce((acc, chapter) => {
            const book = Object.keys(booksMap).find(k => booksMap[k] === chapter.book_id);
            acc[`${book}_${chapter.chapter_number}`] = chapter.id;
            return acc;
        }, {});
    };

    // Optimized verse batch processing
    const processVerseBatch = async (verses, chaptersMap) => {
        const versesToInsert = verses.map(({ chapter_key, verse, text }) => ({
            chapter_id: chaptersMap[chapter_key],
            verse_number: parseInt(verse, 10),
            text: text
        }));

        const { error } = await supabase
            .from("verses")
            .insert(versesToInsert);

        if (error) throw error;
    };

    const handleLoadFile = async () => {
        if (!selectedFile || !bibleVersionId) {
            setError("Please select a file and ensure a valid Bible Version ID is provided.");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            const fileContent = await selectedFile.text();
            const lines = fileContent.split(/\r?\n/).filter(line => line.trim());

            // Skip header and collect unique books and chapters
            const uniqueBooks = new Set();
            const chaptersMap = new Map();
            const verses = [];

            // First pass - collect metadata
            for (let i = 1; i < lines.length; i++) {
                // Parse CSV considering quotes
                let inQuotes = false;
                let currentField = '';
                const fields = [];

                for (let char of lines[i]) {
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        fields.push(currentField.trim());
                        currentField = '';
                    } else {
                        currentField += char;
                    }
                }
                fields.push(currentField.trim()); // Add last field

                const [book, chapter, verse, text] = fields;

                if (!book || !chapter || !verse || !text) continue;

                // Clean text field (remove surrounding quotes)
                const cleanText = text.replace(/^"(.*)"$/, '$1').replace(/""/g, '"');

                uniqueBooks.add(book);
                const chapterKey = `${book}_${chapter}`;
                if (!chaptersMap.has(chapterKey)) {
                    chaptersMap.set(chapterKey, { book, chapter, verseCount: 1 });
                } else {
                    chaptersMap.get(chapterKey).verseCount++;
                }

                verses.push({ chapter_key: chapterKey, verse, text: cleanText });
            }

            // Process books
            const booksMap = await processBooksInBulk([...uniqueBooks]);

            // Process chapters
            const chaptersLookup = await processChaptersInBulk(
                [...chaptersMap.values()],
                booksMap
            );

            // Process verses in batches
            for (let i = 0; i < verses.length; i += BATCH_SIZE) {
                const batch = verses.slice(i, i + BATCH_SIZE);
                await processVerseBatch(batch, chaptersLookup);
                setProgress(Math.round(((i + batch.length) / verses.length) * 100));
            }

            alert("Bible data successfully loaded!");
        } catch (err) {
            console.error("Error loading file:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 bg-white shadow-lg rounded-lg">
            <h2 className="text-xl font-bold mb-4">Load Bible Data</h2>

            <input
                type="file"
                accept=".csv"
                className="form-input mb-4"
                onChange={e => {
                    setSelectedFile(e.target.files[0]);
                    setError(null);
                }}
            />

            <button
                onClick={handleLoadFile}
                disabled={loading}
                className={`bg-blue-500 text-white px-4 py-2 rounded ${
                    loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
            >
                {loading ? `Loading... ${progress}%` : "Load Data"}
            </button>

            {loading && (
                <div className="mt-4">
                    <div className="h-4 bg-gray-200 rounded-full">
                        <div
                            className="h-4 bg-green-500 rounded-full"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">{progress}% Complete</p>
                </div>
            )}

            {error && <div className="mt-4 text-red-500">Error: {error}</div>}
        </div>
    );
};

export default LoadBibleData;