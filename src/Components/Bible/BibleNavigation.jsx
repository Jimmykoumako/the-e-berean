import { useBibleData } from './../../hooks/bibleData.js';
import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeftIcon,
    BookOpenIcon,
    BookmarkIcon,
    PencilIcon,
    ArrowLeftIcon, DocumentTextIcon,
} from '@heroicons/react/24/solid';
import BibleContent from './BibleContent';
import BookmarksContent from './BookmarksContent';
import NotesContent from './NotesContent';
import {ChevronDownIcon, ChevronRightIcon} from "@heroicons/react/24/solid/index.js";
import SessionDisplay from "./SessionDisplay.jsx";


export const SidebarItem = React.memo(({ icon: Icon, label, onClick, collapsed }) => (
    <li
        className="cursor-pointer flex items-center hover:bg-gray-700 p-2 rounded"
        onClick={onClick}
    >
        <Icon className="h-6 w-6 text-white" />
        {!collapsed && <span className="ml-2">{label}</span>}
    </li>
));

export const BackHeader = React.memo(({ title, onBack, collapsed }) => (
    <div className="flex items-center mb-4">
        <ChevronLeftIcon className="h-6 w-6 cursor-pointer" onClick={onBack} />
        {!collapsed && <h2 className="text-xl font-bold ml-2">{title}</h2>}
    </div>
));

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

    const [sidebarSection, setSidebarSection] = useState('main');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [expandedBooks, setExpandedBooks] = useState({});
    const [bookmarks, setBookmarks] = useState(
        JSON.parse(localStorage.getItem('bookmarks')) || []
    );
    const [notes, setNotes] = useState(JSON.parse(localStorage.getItem('notes')) || {});
    const [sessions, setSessions] = useState(
        JSON.parse(localStorage.getItem('sessions')) || {}
    );
    const [currentSession, setCurrentSession] = useState(
        JSON.parse(localStorage.getItem('currentSession')) || null
    );

    useEffect(() => {
        if (selectedVersion) fetchBooks(selectedVersion);
    }, [selectedVersion]);

    const toggleBookExpansion = (bookId) => {
        fetchChapters(bookId);
        setExpandedBooks((prev) => ({
            ...prev,
            [bookId]: !prev[bookId] ? chapters : false,
        }));
    };

    const handleChapterClick = (bookId, chapterId) => {
        setSelectedBook(bookId);
        setSelectedChapter(chapterId);
        fetchAndSetVerses(chapterId);
    };

    const renderSidebarContent = () => {
        switch (sidebarSection) {
            case 'main':
                return (
                    <ul className="space-y-4">
                        <SidebarItem
                            icon={BookOpenIcon}
                            label="Bible"
                            onClick={() => setSidebarSection('bible')}
                            collapsed={sidebarCollapsed}
                        />
                        <SidebarItem
                            icon={BookmarkIcon}
                            label="Bookmarks"
                            onClick={() => setSidebarSection('bookmarks')}
                            collapsed={sidebarCollapsed}
                        />
                        <SidebarItem
                            icon={PencilIcon}
                            label="Notes"
                            onClick={() => setSidebarSection('notes')}
                            collapsed={sidebarCollapsed}
                        />
                        <SidebarItem
                            icon={DocumentTextIcon}
                            label="Sessions"
                            onClick={() => setSidebarSection('sessions')}
                            collapsed={sidebarCollapsed}
                        />
                    </ul>
                );
            case 'bible':
                return (
                    <>
                        <BackHeader
                            title="Bible"
                            onBack={() => setSidebarSection('main')}
                            collapsed={sidebarCollapsed}
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
                            collapsed={sidebarCollapsed}
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
                            collapsed={sidebarCollapsed}
                        />
                        <ul className="space-y-2">
                            {Object.entries(notes).map(([verseId, note]) => (
                                <li
                                    key={verseId}
                                    className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                                    onClick={() => alert(`Note for Verse ${verseId}: ${note}`)}
                                >
                                    Verse {verseId}: {note.slice(0, 30)}...
                                </li>
                            ))}
                        </ul>
                    </>
                );
            case 'sessions':
                return (
                    <>
                        <BackHeader
                            title="Sessions"
                            onBack={() => setSidebarSection('main')}
                            collapsed={sidebarCollapsed}
                        />
                        <ul className="space-y-2">
                            {Object.entries(sessions).map(([session]) => (
                                <li
                                    key={session.sessionName}
                                    className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600"
                                    onClick={() => setCurrentSession(session.sessionName)}
                                >
                                    {session.sessionName}
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
            <div
                className={`${
                    sidebarCollapsed ? 'w-16' : 'w-64'
                } bg-gray-800 text-white p-4 transition-all duration-300`}
            >
                <div className="flex items-center justify-between mb-4">
                    {!sidebarCollapsed && <h2 className="text-xl font-bold">Menu</h2>}
                    <ArrowLeftIcon
                        className={`h-6 w-6 cursor-pointer transform ${
                            sidebarCollapsed ? 'rotate-180' : ''
                        }`}
                        onClick={() => setSidebarCollapsed((prev) => !prev)}
                    />
                </div>
                {renderSidebarContent()}
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 bg-gray-100">
                <h1 className="text-2xl font-bold mb-4">Bible Viewer</h1>

                {sidebarSection === 'bible' && (
                    <BibleContent
                        books={books}
                        chapters={chapters}
                        verses={verses}
                        selectedBook={selectedBook}
                        selectedChapter={selectedChapter}
                        setSelectedBook={setSelectedBook}
                        setSelectedChapter={setSelectedChapter}
                        fetchAndSetVerses={fetchAndSetVerses}
                    />
                )}
                {sidebarSection === 'bookmarks' && (
                    <BookmarksContent
                        bookmarks={bookmarks}
                        setSelectedBook={setSelectedBook}
                        setSelectedChapter={setSelectedChapter}
                        fetchAndSetVerses={fetchAndSetVerses}
                    />
                )}
                {sidebarSection === 'notes' && <NotesContent notes={notes} />}
                {/* Session Display */}
                {currentSession && (
                    <SessionDisplay
                        sessionName={currentSession}
                        sessionVerses={sessions[currentSession]}
                        verses={verses}
                        updateSessions={setSessions}
                        sessions={sessions}
                    />
                )}
            </div>
        </div>
    );
}
