import { useBibleData } from './../../hooks/bibleData.js';
import { useState, useEffect } from 'react';
import {
    ChevronDownIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
} from '@heroicons/react/24/solid';

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

    const [sidebarSection, setSidebarSection] = useState('main'); // Current sidebar section
    const [highlightedVerses, setHighlightedVerses] = useState(
        JSON.parse(localStorage.getItem('highlights')) || {}
    );
    const [bookmarks, setBookmarks] = useState(
        JSON.parse(localStorage.getItem('bookmarks')) || []
    );
    const [notes, setNotes] = useState(JSON.parse(localStorage.getItem('notes')) || {});
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredVerses, setFilteredVerses] = useState([]);
    const [expandedBooks, setExpandedBooks] = useState({}); // Track expanded books

    useEffect(() => {
        if (selectedVersion) fetchBooks(selectedVersion);
    }, [selectedVersion]);

    useEffect(() => {
        if (verses.length > 0) {
            setFilteredVerses(
                verses.filter(
                    (verse) =>
                        verse.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        verse.verse_number.toString().includes(searchQuery)
                )
            );
        }
    }, [verses, searchQuery]);

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

    const handleHighlight = (verseId, color) => {
        const newHighlights = { ...highlightedVerses, [verseId]: color };
        setHighlightedVerses(newHighlights);
        localStorage.setItem('highlights', JSON.stringify(newHighlights));
    };

    const addToBookmark = (verse) => {
        const updatedBookmarks = [...bookmarks, verse];
        setBookmarks(updatedBookmarks);
        localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
    };

    const addNote = (verse) => {
        const note = prompt('Add your note:');
        if (note) {
            const updatedNotes = { ...notes, [verse.id]: note };
            setNotes(updatedNotes);
            localStorage.setItem('notes', JSON.stringify(updatedNotes));
        }
    };

    const BackHeader = ({ title, onBack }) => (
        <div className="flex items-center mb-4">
            <ChevronLeftIcon
                className="h-6 w-6 cursor-pointer"
                onClick={onBack}
            />
            <h2 className="text-xl font-bold ml-2">{title}</h2>
        </div>
    );

    const renderSidebarContent = () => {
        switch (sidebarSection) {
            case 'main':
                return (
                    <>
                        <h2 className="text-xl font-bold mb-4">Menu</h2>
                        <ul className="space-y-4">
                            {['Bible', 'Bookmarks', 'Notes'].map((item) => (
                                <li
                                    key={item}
                                    className="cursor-pointer hover:bg-gray-700 p-2 rounded"
                                    onClick={() =>
                                        setSidebarSection(item.toLowerCase())
                                    }
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </>
                );
            case 'bible':
                return (
                    <>
                        <BackHeader
                            title="Bible"
                            onBack={() => setSidebarSection('main')}
                        />
                        <div>
                            <label className="block text-sm font-medium mb-1">
                                Select Version
                            </label>
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
                        <ul className="mt-4 space-y-2">
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
                    </>
                );
            case 'bookmarks':
                return (
                    <>
                        <BackHeader
                            title="Bookmarks"
                            onBack={() => setSidebarSection('main')}
                        />
                        <ul className="space-y-2">
                            {bookmarks.map((bookmark, idx) => (
                                <li
                                    key={idx}
                                    className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                                    onClick={() => {
                                        setSelectedBook(bookmark.book_id);
                                        setSelectedChapter(bookmark.chapter_id);
                                        fetchAndSetVerses(bookmark.chapter_id);
                                    }}
                                >
                                    {bookmark.book_name} - Chapter {bookmark.chapter_number}:{' '}
                                    {bookmark.verse_number}
                                </li>
                            ))}
                        </ul>
                    </>
                );
            case 'notes':
                return (
                    <>
                        <BackHeader
                            title="Notes"
                            onBack={() => setSidebarSection('main')}
                        />
                        <ul className="space-y-2">
                            {Object.entries(notes).map(([verseId, note]) => (
                                <li
                                    key={verseId}
                                    className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                                    onClick={() => {
                                        alert(`Note for Verse ${verseId}: ${note}`);
                                    }}
                                >
                                    Verse {verseId}: {note.slice(0, 30)}...
                                </li>
                            ))}
                        </ul>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <div className="w-64 bg-gray-800 text-white p-4">
                {renderSidebarContent()}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 bg-gray-100">
                <h1 className="text-2xl font-bold mb-4">Bible Viewer</h1>

                {sidebarSection === 'bible' && selectedChapter && (
                    <div className="bg-white p-4 rounded shadow">
                        <h2 className="text-lg font-bold mb-2">
                            {books.find((b) => b.id === selectedBook)?.name} - Chapter{' '}
                            {chapters.find((ch) => ch.id === selectedChapter)?.chapter_number}
                        </h2>
                        <ul className="space-y-2">
                            {filteredVerses.map((verse) => (
                                <li
                                    key={verse.id}
                                    className={`cursor-pointer hover:bg-gray-200 p-2 rounded ${
                                        highlightedVerses[verse.id]
                                            ? `bg-${highlightedVerses[verse.id]}-200`
                                            : ''
                                    }`}
                                    onDoubleClick={() => {
                                        if (confirm('Add to Bookmark?')) addToBookmark(verse);
                                        else addNote(verse);
                                    }}
                                >
                                    <span className="font-semibold">{verse.verse_number}: </span>
                                    {verse.text}
                                    <button
                                        onClick={() => handleHighlight(verse.id, 'yellow')}
                                        className="ml-2 text-yellow-500"
                                    >
                                        Highlight
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {sidebarSection === 'bookmarks' && <p>Select a bookmark to view.</p>}

                {sidebarSection === 'notes' && <p>Select a note to view details.</p>}
            </div>
        </div>
    );
}
