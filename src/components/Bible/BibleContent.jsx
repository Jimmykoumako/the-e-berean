import React, { useState, useEffect } from 'react';

const BibleContent = ({
                          books,
                          chapters,
                          verses,
                          selectedBook,
                          selectedChapter,
                      }) => {
    const [selectedVerse, setSelectedVerse] = useState(null);
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0 });
    const [sessions, setSessions] = useState(
        JSON.parse(localStorage.getItem('sessions')) || {}
    );
    const [currentSession, setCurrentSession] = useState(
        JSON.parse(localStorage.getItem('currentSession')) || null
    );

    useEffect(() => {
        localStorage.setItem('sessions', JSON.stringify(sessions));
        localStorage.setItem('currentSession', JSON.stringify(currentSession));
    }, [sessions, currentSession]);

    // Handle double-click on a verse
    const handleVerseDoubleClick = (event, verse) => {
        event.stopPropagation();
        setSelectedVerse(verse);
        setContextMenu({ visible: true, x: event.clientX, y: event.clientY });
    };

    const addToLatestSession = (verse) => {
        if (!currentSession) {
            alert('No active session. Please create a new session.');
            return;
        }
        const updatedSessions = { ...sessions };
        if (!updatedSessions[currentSession]) {
            updatedSessions[currentSession] = [];
        }
        if (!updatedSessions[currentSession].some((v) => v.id === verse.id)) {
            updatedSessions[currentSession].push({ id: verse.id, note: '' });
            setSessions(updatedSessions);
        } else {
            alert('Verse already exists in the session.');
        }
        setContextMenu({ visible: false });
    };

    const createNewSession = () => {
        const sessionName = prompt('Enter a name for the new session:');
        if (sessionName) {
            const updatedSessions = { ...sessions, [sessionName]: [] };
            setSessions(updatedSessions);
            setCurrentSession(sessionName);
            alert(`Session "${sessionName}" created and set as active.`);
        }
        setContextMenu({ visible: false });
    };

    const addToExistingSession = (verse) => {
        const sessionNames = Object.keys(sessions);
        const sessionName = prompt(
            `Select a session to add to:\n${sessionNames.join('\n')}`
        );
        if (sessionName && sessions[sessionName]) {
            const updatedSessions = { ...sessions };
            if (!updatedSessions[sessionName].some((v) => v.id === verse.id)) {
                updatedSessions[sessionName].push({ id: verse.id, note: '' });
                setSessions(updatedSessions);
                alert(`Verse added to session "${sessionName}".`);
            } else {
                alert('Verse already exists in the selected session.');
            }
        }
        setContextMenu({ visible: false });
    };

    // Add a verse to bookmarks
    const addToBookmark = (verse) => {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
        if (!bookmarks.some((b) => b.id === verse.id)) {
            bookmarks.push(verse);
            localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
            alert('Verse bookmarked!');
        }
        setContextMenu({ visible: false });
    };

    // Add a note to a verse
    const addNote = (verse) => {
        const note = prompt('Add your note:');
        if (note) {
            const notes = JSON.parse(localStorage.getItem('notes') || '{}');
            notes[verse.id] = note;
            localStorage.setItem('notes', JSON.stringify(notes));
            alert('Note added!');
        }
        setContextMenu({ visible: false });
    };

    return (
        <div className="bg-white p-4 rounded shadow relative">
            {selectedChapter && (
                <>
                    <h2 className="text-lg font-bold mb-2">
                        {books.find((b) => b.id === selectedBook)?.name} - Chapter{' '}
                        {chapters.find((ch) => ch.id === selectedChapter)?.chapter_number}
                    </h2>
                    <ul className="space-y-2">
                        {verses.map((verse) => (
                            <li
                                key={verse.id}
                                onDoubleClick={(event) => handleVerseDoubleClick(event, verse)}
                                className="cursor-pointer hover:bg-gray-200 p-2 rounded"
                            >
                                <span className="font-semibold">{verse.verse_number}: </span>
                                {verse.text}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {/* Context Menu */}
            {contextMenu.visible && (
                <div
                    className="absolute bg-white border rounded shadow p-2"
                    style={{ top: contextMenu.y, left: contextMenu.x }}
                    role="menu"
                    aria-label="Verse Actions Menu"
                >
                    <button
                        onClick={() => addToLatestSession(selectedVerse)}
                        className="block w-full text-left p-2 hover:bg-gray-200"
                    >
                        Add to Latest Session
                    </button>
                    <button
                        onClick={() => addToExistingSession(selectedVerse)}
                        className="block w-full text-left p-2 hover:bg-gray-200"
                    >
                        Add to Existing Session
                    </button>
                    <button
                        onClick={createNewSession}
                        className="block w-full text-left p-2 hover:bg-gray-200"
                    >
                        Create New Session
                    </button>
                    <button
                        onClick={() => addToBookmark(selectedVerse)}
                        className="block w-full text-left p-2 hover:bg-gray-200"
                    >
                        Add to Bookmark
                    </button>
                    <button
                        onClick={() => addNote(selectedVerse)}
                        className="block w-full text-left p-2 hover:bg-gray-200"
                    >
                        Add Note
                    </button>
                </div>
            )}
            {!selectedChapter && <p className="text-gray-500">Select a chapter to view verses.</p>}

            {/* Current Session Display */}
            {currentSession && (
                <div className="mt-4 p-2 bg-gray-100 rounded">
                    <h3 className="font-bold">Current Session: {currentSession}</h3>
                    <ul className="list-disc ml-4">
                        {sessions[currentSession]?.map((item, index) => (
                            <li key={index}>
                                {item.text}
                                {item.notes && <p className="text-sm text-gray-500">Note: {item.notes}</p>}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default BibleContent;
