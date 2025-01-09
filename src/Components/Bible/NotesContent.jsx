import React from 'react';

const NotesContent = ({ notes }) => {
    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">Notes</h2>
            {Object.keys(notes).length > 0 ? (
                <ul className="space-y-2">
                    {Object.entries(notes).map(([verseId, note]) => (
                        <li
                            key={verseId}
                            className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 text-white"
                            onClick={() => alert(`Note for Verse ${verseId}: ${note}`)}
                        >
                            <span className="font-semibold">Verse {verseId}:</span> {note.slice(0, 30)}...
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-gray-500">No notes added yet.</p>
            )}
        </div>
    );
};

export default NotesContent;
