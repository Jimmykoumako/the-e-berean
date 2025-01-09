import { useQuery, useQueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { supabase } from './../../supabaseClient'
import {useEffect, useState} from "react";


// Storage persister setup
const localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'BIBLE_CACHE', // Cache key in localStorage
    throttleTime: 1000, // Time between storage writes
    serialize: data => JSON.stringify(data),
    deserialize: data => JSON.parse(data),
});

// Separate API functions for cleaner code and reusability
const api = {
    getVersions: async () => {
        try {
            const { data, error } = await supabase.from('bible_versions').select('*');
            if (error) throw error;
            return data;
        } catch (error) {
            // If offline, throw specific error for offline handling
            if (!navigator.onLine) throw new Error('OFFLINE');
            throw error;
        }
    },

    getBooks: async (versionId) => {
        const { data, error } = await supabase
            .from('books')
            .select('*')
            .eq('bible_version_id', versionId);
        if (error) throw error;
        return data;
    },

    getChapters: async (bookId) => {
        const { data, error } = await supabase
            .from('chapters')
            .select('*')
            .eq('book_id', bookId);
        if (error) throw error;
        return data;
    },

    getVerses: async (chapterId) => {
        const { data, error } = await supabase
            .from('verses')
            .select('*')
            .eq('chapter_id', chapterId)
            .order('verse_number', { ascending: true });
        if (error) throw error;
        return data;
    },
};

export const useBooks = (selectedVersion) => {
    return useQuery({
        queryKey: ['books', selectedVersion],
        queryFn: () => api.getBooks(selectedVersion),
        enabled: !!selectedVersion,
        staleTime: 24 * 60 * 60 * 1000,
        cacheTime: 7 * 24 * 60 * 60 * 1000,
    });
};

export function useBibleData() {

    const queryClient = useQueryClient();

    // Setup persistence
    useEffect(() => {
        persistQueryClient({
            queryClient,
            persister: localStoragePersister,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            buster: 'v1', // Cache version - increment to invalidate old caches
        });
    }, [queryClient]);

    // Online status tracking
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Versions query with offline support
    const {
        data: versions = [],
        isLoading: isLoadingVersions,
        error: versionsError,
    } = useQuery({
        queryKey: ['versions'],
        queryFn: api.getVersions,
        staleTime: 24 * 60 * 60 * 1000,
        cacheTime: 7 * 24 * 60 * 60 * 1000,
        retry: isOnline ? 3 : false, // Only retry if online
        networkMode: 'offlineFirst', // Use cached data when offline
    });

    // Books query - enabled when version is selected
    const {
        data: books = [],
        isLoading: isLoadingBooks,
        error: booksError,
    } = useQuery({
        queryKey: ['books', selectedVersion],
        queryFn: () => api.getBooks(selectedVersion),
        enabled: !!selectedVersion,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours - books rarely change
        cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Chapters query - enabled when book is selected
    const {
        data: chapters = [],
        isLoading: isLoadingChapters,
        error: chaptersError,
    } = useQuery({
        queryKey: ['chapters', selectedBook],
        queryFn: () => api.getChapters(selectedBook),
        enabled: !!selectedBook,
        staleTime: 24 * 60 * 60 * 1000, // 24 hours - chapters rarely change
        cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Verses query - enabled when chapter is selected
    const {
        data: verses = [],
        isLoading: isLoadingVerses,
        error: versesError,
    } = useQuery({
        queryKey: ['verses', selectedChapter],
        queryFn: () => api.getVerses(selectedChapter),
        enabled: !!selectedChapter,
        staleTime: 60 * 60 * 1000, // 1 hour - verses might have annotations or updates
        cacheTime: 24 * 60 * 60 * 1000, // 24 hours
    });

    // Selection state management
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [selectedBook, setSelectedBook] = useState(null);
    const [selectedChapter, setSelectedChapter] = useState(null);

    // Clear dependent selections when parent selection changes
    useEffect(() => {
        if (selectedVersion === null) {
            setSelectedBook(null);
            setSelectedChapter(null);
        }
    }, [selectedVersion]);

    useEffect(() => {
        if (selectedBook === null) {
            setSelectedChapter(null);
        }
    }, [selectedBook]);

    // Optional: Prefetch books when hovering over version selection
    // const queryClient = useQueryClient();
    const prefetchBooks = (versionId) => {
        queryClient.prefetchQuery({
            queryKey: ['books', versionId],
            queryFn: () => api.getBooks(versionId),
            staleTime: 24 * 60 * 60 * 1000,
        });
    };

    // Background sync when coming back online
    useEffect(() => {
        if (isOnline) {
            queryClient.invalidateQueries({
                predicate: query =>
                    query.state.error?.message === 'OFFLINE'
            });
        }
    }, [isOnline, queryClient]);

    return {
        // Data
        versions,
        books,
        chapters,
        verses,

        // Loading states
        isLoading: {
            versions: isLoadingVersions,
            books: isLoadingBooks,
            chapters: isLoadingChapters,
            verses: isLoadingVerses,
        },

        // Errors
        errors: {
            versions: versionsError,
            books: booksError,
            chapters: chaptersError,
            verses: versesError,
        },

        // Selection state
        selectedVersion,
        selectedBook,
        selectedChapter,

        // Selection setters
        setSelectedVersion,
        setSelectedBook,
        setSelectedChapter,

        // Prefetching
        prefetchBooks,

        //
        isOnline
    };
}