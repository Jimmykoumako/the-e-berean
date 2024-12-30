import { useBibleData } from './../../hooks/bibleData.js';
import { useMemo, useState } from 'react';

export default function BibleSearch() {
    const {
        versions,
        books,
        chapters,
        verses,
        selectedVersion,
        selectedBook,
        selectedChapter,
        setSelectedVersion,
        setSelectedBook,
        setSelectedChapter,
        fetchBooks,
        fetchChapters,
        fetchAndSetVerses,
    } = useBibleData();

    const [isParagraphView, setIsParagraphView] = useState(false);

    const handleVersionChange = (e) => {
        const versionId = e.target.value;
        setSelectedVersion(versionId);
        fetchBooks(versionId);
    };

    const handleBookChange = (e) => {
        const bookId = e.target.value;
        setSelectedBook(bookId);
        fetchChapters(bookId);
    };

    const handleChapterChange = (e) => {
        const chapterId = e.target.value;
        setSelectedChapter(chapterId);
        fetchAndSetVerses(chapterId);
    };

    const renderedVerses = useMemo(() => {
        if (isParagraphView) {
            return (
                <p>
                    {verses.map((verse) => (
                        <span key={verse.id}>
                            <span className="font-semibold">{verse.verse_number}: </span>
                            {verse.text}{' '}
                        </span>
                    ))}
                </p>
            );
        }

        return (
            <ul className="space-y-2">
                {verses.map((verse) => (
                    <li key={verse.id}>
                        <span className="font-semibold">{verse.verse_number}: </span>
                        {verse.text}
                    </li>
                ))}
            </ul>
        );
    }, [verses, isParagraphView]);

    const selectClassName = "w-full border-gray-300 rounded p-2";

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-xl font-bold mb-4">Bible Search</h1>

            <div className="mb-4">
                <label htmlFor="versionSelect" className="block text-sm font-medium mb-1">
                    Select Version
                </label>
                <select
                    id="versionSelect"
                    className={selectClassName}
                    onChange={handleVersionChange}
                >
                    <option value="">-- Select Version --</option>
                    {versions.map((version) => (
                        <option key={version.id} value={version.id}>
                            {version.version_name}
                        </option>
                    ))}
                </select>
            </div>

            {selectedVersion && (
                <div className="mb-4">
                    <label htmlFor="bookSelect" className="block text-sm font-medium mb-1">
                        Select Book
                    </label>
                    <select
                        id="bookSelect"
                        className={selectClassName}
                        onChange={handleBookChange}
                    >
                        <option value="">-- Select Book --</option>
                        {books.map((book) => (
                            <option key={book.id} value={book.id}>
                                {book.name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedBook && (
                <div className="mb-4">
                    <label htmlFor="chapterSelect" className="block text-sm font-medium mb-1">
                        Select Chapter
                    </label>
                    <select
                        id="chapterSelect"
                        className={selectClassName}
                        onChange={handleChapterChange}
                    >
                        <option value="">-- Select Chapter --</option>
                        {chapters.map((chapter) => (
                            <option key={chapter.id} value={chapter.id}>
                                Chapter {chapter.chapter_number}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {selectedChapter && verses.length > 0 && (
                <div className="mt-4 bg-white p-4 rounded shadow">
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-lg font-bold">Verses</h2>
                        <button
                            onClick={() => setIsParagraphView((prev) => !prev)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
                        >
                            {isParagraphView ? 'Show as List' : 'Show as Paragraph'}
                        </button>
                    </div>
                    {renderedVerses}
                </div>
            )}
        </div>
    );
}
