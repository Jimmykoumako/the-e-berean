import React from 'react';

const BookmarksContent = ({ bookmarks, setSelectedBook, setSelectedChapter, fetchAndSetVerses }) => {
    return (
        <div className="bg-white p-4 rounded shadow">
            <h2 className="text-lg font-bold mb-2">Bookmarks</h2>
            {bookmarks.length > 0 ? (
                <ul className="space-y-2">
                    {bookmarks.map((bookmark, idx) => (
                        <li
                            key={idx}
                            className="p-2 bg-gray-700 rounded cursor-pointer hover:bg-gray-600 text-white"
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
            ) : (
                <p className="text-gray-500">No bookmarks added yet.</p>
            )}
        </div>
    );
};

export default BookmarksContent;
