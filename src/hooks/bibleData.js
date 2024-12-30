import { useState, useEffect } from 'react';
import { supabase } from './../../supabaseClient';

export function useBibleData() {
    const [versions, setVersions] = useState([]);
    const [books, setBooks] = useState([]);
    const [chapters, setChapters] = useState([]);
    const [verses, setVerses] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null)

    useEffect(() => {
        const fetchVersions = async () => {
            const { data, error } = await supabase.from('bible_versions').select('*');
            if (error) console.error('Error fetching versions:', error);
            else setVersions(data);
        };
        fetchVersions();
    }, []);

    const fetchBooks = async (versionId) => {
        const { data, error } = await supabase.from('books').select('*').eq('bible_version_id', versionId);
        if (error) console.error('Error fetching books:', error);
        else setBooks(data);
    };

    const fetchChapters = async (bookId) => {
        const { data, error } = await supabase.from('chapters').select('*').eq('book_id', bookId);
        if (error) console.error('Error fetching chapters:', error);
        else setChapters(data);
    };

    const fetchVerses = async (chapterId) => {
        const { data, error } = await supabase.from('verses').select('*').eq('chapter_id', chapterId).order('verse_number', { ascending: true });
        if (error) {
            console.error('Error fetching verses:', error);
            return [];
        }
        return data;
    };

    const fetchAndSetVerses = async (chapterId) => {
        const data = await fetchVerses(chapterId);
        setVerses(data);
    };
    return {
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
    };
}
