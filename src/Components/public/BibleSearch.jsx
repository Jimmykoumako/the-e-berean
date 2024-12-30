import { useBibleData } from './../../hooks/bibleData.js';
import { useState, useEffect } from 'react';
import { ChevronRightIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

export default function BibleNavigation() {
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

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedBooks, setExpandedBooks] = useState({}); // Track expanded books

    useEffect(() => {
        if (selectedVersion) fetchBooks(selectedVersion);
    }, [selectedVersion]);

    const toggleBookExpansion = (bookId) => {
        setExpandedBooks((prev) => ({
            ...prev,
            [bookId]: !prev[bookId],
        }));
    };

    const handleChapterClick = (bookId, chapterId) => {
        setSelectedBook(bookId);
        setSelectedChapter(chapterId);
        fetchAndSetVerses(chapterId);
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar for Navigation */}
            <div
                className={`${
                    isSidebarOpen ? 'w-64' : 'w-16'
                } bg-gray-800 text-white transition-width duration-300`}
            >
                <button
                    onClick={() => setIsSidebarOpen((prev) => !prev)}
                    className="p-4 bg-gray-900 hover:bg-gray-700 w-full text-center"
                >
                    {isSidebarOpen ? 'Close' : 'Open'}
                </button>

                {isSidebarOpen && (
                    <div className="p-4">
                        <h2 className="text-xl font-bold mb-4">Bible Table of Contents</h2>

                        {/* Version Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1">Select Version</label>
                            <select
                                className="w-full border-gray-300 rounded p-2 bg-gray-700 text-white"
                                value={selectedVersion || ''}
                                onChange={(e) => setSelectedVersion(e.target.value)}
                            >
                                <option value="">-- Select Version --</option>
                                {versions.map((version) => (
                                    <option key={version.id} value={version.id}>
                                        {version.version_name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Books */}
                        <ul className="space-y-2">
                            {books.map((book) => (
                                <li key={book.id}>
                                    <div
                                        className="flex justify-between items-center cursor-pointer hover:bg-gray-700 p-2 rounded"
                                        onClick={() => toggleBookExpansion(book.id)}
                                    >
                                        <span>{book.name}</span>
                                        {expandedBooks[book.id] ? (
                                            <ChevronDownIcon className="h-5 w-5" />
                                        ) : (
                                            <ChevronRightIcon className="h-5 w-5" />
                                        )}
                                    </div>

                                    {expandedBooks[book.id] && (
                                        <ul className="ml-4 mt-2 space-y-1">
                                            {chapters
                                                .filter((ch) => ch.book_id === book.id)
                                                .map((chapter) => (
                                                    <li
                                                        key={chapter.id}
                                                        className="cursor-pointer hover:bg-gray-700 p-1 rounded"
                                                        onClick={() =>
                                                            handleChapterClick(book.id, chapter.id)
                                                        }
                                                    >
                                                        Chapter {chapter.chapter_number}
                                                    </li>
                                                ))}
                                        </ul>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-6 bg-gray-100">
                <h1 className="text-2xl font-bold mb-4">Bible Viewer</h1>

                {selectedChapter && verses.length > 0 ? (
                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="text-lg font-bold mb-2">
                            {books.find((b) => b.id === selectedBook)?.name} - Chapter{' '}
                            {chapters.find((ch) => ch.id === selectedChapter)?.chapter_number}
                        </h2>
                        <ul className="space-y-2">
                            {verses.map((verse) => (
                                <li key={verse.id}>
                                    <span className="font-semibold">{verse.verse_number}: </span>
                                    {verse.text}
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : (
                    <p className="text-gray-500">Select a chapter to view verses.</p>
                )}
            </div>
        </div>
    );
}
