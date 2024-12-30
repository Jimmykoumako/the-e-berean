import { useState } from "react";
import { supabase } from "./../../../supabaseClient";
import { chapterCountMap, getTestamentId } from "../../utlis/bibleBooks.js";

// Create a Web Worker for parsing CSV
const workerCode = `
  self.onmessage = async (e) => {
    const { fileContent } = e.data;
    const lines = fileContent.split(/\\r?\\n/);
    const header = lines[0];
    const rows = lines.slice(1).filter(line => line.trim());
    
    const parseCSVLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    const parsedData = rows.map(row => {
      const [book, chapter, verse, text] = parseCSVLine(row);
      return { book, chapter, verse, text: text.replace(/^"(.*)"$/, '$1').replace(/""/g, '"') };
    });

    self.postMessage({ parsedData });
  };
`;

const workerBlob = new Blob([workerCode], { type: 'text/javascript' });
const workerUrl = URL.createObjectURL(workerBlob);

const BATCH_SIZE = 500; // Adjust based on Supabase limits

const LoadBibleData = ({ bibleVersionId, storageBucket = "bibles" }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState(null);

    // Process books in bulk
    const processBooksInBulk = async (uniqueBooks) => {
        const booksToInsert = uniqueBooks.map((book, index) => ({
            name: book,
            code_name: book,
            bible_version_id: bibleVersionId,
            testament_id: getTestamentId(book),
            order_in_version: index,
            chapter_count: chapterCountMap[book] || 0,
        }));

        const { data: books, error } = await supabase
            .from("books")
            .upsert(booksToInsert, { onConflict: ["name", "bible_version_id"] })
            .select("id, name");

        if (error) throw error;
        return books.reduce((acc, book) => {
            acc[book.name] = book.id;
            return acc;
        }, {});
    };

    // Process chapters in bulk
    const processChaptersInBulk = async (chaptersData, booksMap) => {
        const chaptersToInsert = chaptersData.map(({ book, chapter }) => ({
            book_id: booksMap[book],
            chapter_number: parseInt(chapter, 10),
        }));

        const { data: chapters, error } = await supabase
            .from("chapters")
            .upsert(chaptersToInsert, { onConflict: ["book_id", "chapter_number"] })
            .select("id, book_id, chapter_number");

        if (error) throw error;
        return chapters.reduce((acc, chapter) => {
            const book = Object.keys(booksMap).find(k => booksMap[k] === chapter.book_id);
            acc[`${book}_${chapter.chapter_number}`] = chapter.id;
            return acc;
        }, {});
    };

    // Process verses in optimized batches
    const processVersesBatch = async (verses, chaptersMap, currentBatch, totalBatches) => {
        const versesToInsert = verses.map(({ book, chapter, verse, text }) => ({
            chapter_id: chaptersMap[`${book}_${chapter}`],
            verse_number: parseInt(verse, 10),
            text: text,
        }));

        const { error } = await supabase
            .from("verses")
            .insert(versesToInsert);

        if (error) throw error;
        setProgress(Math.round((currentBatch / totalBatches) * 100));
    };

    const handleLoadFile = async () => {
        if (!selectedFile || !bibleVersionId) {
            setError("Please select a file and ensure a valid Bible Version ID is provided.");
            return;
        }

        setLoading(true);
        setProgress(0);

        try {
            // Read file content
            const fileContent = await selectedFile.text();

            // Create Web Worker for parsing
            const worker = new Worker(workerUrl);

            // Parse CSV in Web Worker
            const parsedData = await new Promise((resolve, reject) => {
                worker.onmessage = (e) => resolve(e.data.parsedData);
                worker.onerror = (e) => reject(e);
                worker.postMessage({ fileContent });
            });

            // Clean up worker
            worker.terminate();

            // Extract unique books and chapters
            const uniqueBooks = new Set(parsedData.map(row => row.book));
            const chaptersSet = new Set();
            parsedData.forEach(({ book, chapter }) => {
                chaptersSet.add(JSON.stringify({ book, chapter }));
            });

            // Process books and chapters in bulk
            const booksMap = await processBooksInBulk([...uniqueBooks]);
            const chaptersData = [...chaptersSet].map(ch => JSON.parse(ch));
            const chaptersMap = await processChaptersInBulk(chaptersData, booksMap);

            // Process verses in batches
            const batches = [];
            for (let i = 0; i < parsedData.length; i += BATCH_SIZE) {
                batches.push(parsedData.slice(i, i + BATCH_SIZE));
            }

            // Process each batch sequentially to avoid overwhelming Supabase
            for (let i = 0; i < batches.length; i++) {
                await processVersesBatch(batches[i], chaptersMap, i + 1, batches.length);
            }

            alert("Bible data successfully loaded!");
        } catch (err) {
            console.error("Error loading file:", err.message);
            setError(err.message);
        } finally {
            setLoading(false);
            URL.revokeObjectURL(workerUrl);
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