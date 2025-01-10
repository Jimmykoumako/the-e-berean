import React, { useState, useEffect } from 'react';
import {supabase} from "../../../supabaseClient";

const SessionDisplay = ({ sessionName, sessionVerses, updateSessions, sessions }) => {
    const [noteEdit, setNoteEdit] = useState(null);
    const [fetchedVerses, setFetchedVerses] = useState({});

    // Fetch a single verse using Supabase
    const fetchVerseById = async (verseId) => {
        const { data, error } = await supabase
            .from('verses') // Replace with your Supabase table name
            .select(
                'id,chapter_id,verse_number,text')
            .eq('id', verseId)
            .single();

        if (error) {
            console.error('Error fetching verse:', error);
            return null;
        }

        return data;
    };

    useEffect(() => {
        const fetchVerses = async () => {
            const versesData = {};
            for (const sessionVerse of sessionVerses) {
                if (!fetchedVerses[sessionVerse.id]) {
                    const verseData = await fetchVerseById(sessionVerse.id);
                    if (verseData) {
                        versesData[sessionVerse.id] = verseData;
                    }
                }
            }
            setFetchedVerses((prev) => ({ ...prev, ...versesData }));
        };

        fetchVerses();
    }, [sessionVerses, fetchedVerses]);

    const removeVerse = (verseId) => {
        const updatedSessions = { ...sessions };
        updatedSessions[sessionName] = updatedSessions[sessionName].filter((v) => v.id !== verseId);
        updateSessions(updatedSessions);
    };

    const addOrEditNote = (verseId, newNote) => {
        const updatedSessions = { ...sessions };
        updatedSessions[sessionName] = updatedSessions[sessionName].map((v) =>
            v.id === verseId ? { ...v, note: newNote } : v
        );
        updateSessions(updatedSessions);
    };

    return (
        <div className="mt-4 p-4 bg-gray-100 rounded shadow">
            <h3 className="font-bold mb-2">Session: {sessionName}</h3>
            <ul className="space-y-2">
                {sessionVerses.map(({ id, note }) => {
                    const verse = fetchedVerses[id];
                    if (!verse) {
                        return (
                            <li key={id} className="p-2 bg-white rounded shadow">
                                <p>Loading verse...</p>
                            </li>
                        );
                    }

                    return (
                        <li key={id} className="p-2 bg-white rounded shadow">
                            <p className="font-semibold">
                                {verse.verse_number}: {verse.text}
                            </p>
                            <p className="text-sm text-gray-500">Reference: {verse.reference}</p>
                            <div className="flex items-center space-x-2 mt-2">
                                <button
                                    onClick={() => removeVerse(id)}
                                    className="text-red-500 hover:underline"
                                >
                                    Remove
                                </button>
                                <button
                                    onClick={() =>
                                        setNoteEdit(noteEdit === id ? null : id)
                                    }
                                    className="text-blue-500 hover:underline"
                                >
                                    {noteEdit === id ? 'Cancel' : 'Edit Note'}
                                </button>
                            </div>
                            {noteEdit === id && (
                                <textarea
                                    defaultValue={note}
                                    onBlur={(e) =>
                                        addOrEditNote(id, e.target.value)
                                    }
                                    className="mt-2 p-2 border rounded w-full"
                                    placeholder="Add a note..."
                                />
                            )}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};

export default SessionDisplay;
