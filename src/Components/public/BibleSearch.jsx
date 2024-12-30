import { useBibleData } from './../../hooks/bibleData.js';

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

    return (
        <div className="p-4 bg-gray-100 min-h-screen">
            <h1 className="text-xl font-bold mb-4">Bible Search</h1>

            {/* Select Bible Version */}
            <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Select Version</label>
                <select
                    className="w-full border-gray-300 rounded p-2"
                    onChange={(e) => {
                        const versionId = e.target.value;
                        setSelectedVersion(versionId);
                        fetchBooks(versionId);
                    }}
                >
                    <option value="">-- Select Version --</option>
                    {versions.map((version) => (
                        <option key={version.id} value={version.id}>
                            {version.version_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Select Book */}
            {selectedVersion && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Select Book</label>
                    <select
                        className="w-full border-gray-300 rounded p-2"
                        onChange={(e) => {
                            const bookId = e.target.value;
                            setSelectedBook(bookId);
                            fetchChapters(bookId);
                        }}
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

            {/* Select Chapter */}
            {selectedBook && (
                <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Select Chapter</label>
                    <select
                        className="w-full border-gray-300 rounded p-2"
                        onChange={(e) => {
                            const chapterId = e.target.value;
                            setSelectedChapter(chapterId);
                            fetchAndSetVerses(chapterId);
                        }}
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

            {/* Display Verses */}
            {selectedChapter && verses.length > 0 && (
                <div className="mt-4 bg-white p-4 rounded shadow">
                    <h2 className="text-lg font-bold mb-2">Verses</h2>
                    <ul className="space-y-2">
                        {verses.map((verse) => (
                            <li key={verse.id}>
                                <span className="font-semibold">{verse.verse_number}: </span>
                                {verse.text}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
