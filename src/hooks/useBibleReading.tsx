import {useState, useCallback, useEffect, useMemo} from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';

// Types
interface BibleReference {
  book: string;
  chapter: number;
  verse: number;
}

interface VerseRange {
  startReference: BibleReference;
  endReference: BibleReference;
  referenceKey?: string;
}

interface Verse {
  id: number;
  chapter_id: number;
  verse_number: number;
  text: string;
}

interface ReadingState {
  currentVersion: string;
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  currentReference: string;
  currentRange: VerseRange | null;
  history: string[];
  historyIndex: number;
  loadedChapters: number[];
  hasNextChapter: boolean;
  hasPreviousChapter: boolean;
  error: Error | null;
}

interface UseBibleReadingProps {
  defaultVersion?: string;
  defaultReference?: string;
  supabaseClient: SupabaseClient;
}

// Constants
const CACHE_TIME = 1000 * 60 * 60; // 1 hour
const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export function useBibleReading({
                                  defaultVersion = 'KJV',
                                  defaultReference = 'John 3:16',
                                  supabaseClient
                                }: UseBibleReadingProps) {
  const queryClient = useQueryClient();

  // State
  const [readingState, setReadingState] = useState<ReadingState>({
    currentVersion: defaultVersion,
    currentBook: 'John',
    currentChapter: 3,
    currentVerse: 16,
    currentReference: defaultReference,
    currentRange: null,
    history: [defaultReference],
    historyIndex: 0
  });

  // Utility functions
  const getVersionId = useCallback(async (version: string): Promise<number> => {
    console.log("Getting version ID for:", version);
    try {
      const { data, error } = await supabaseClient
          .from('bible_versions')
          .select('id')
          .eq('abbreviation', version)
          .single();

      if (error) {
        console.error("Error getting version ID:", error);
        throw error;
      }

      if (!data) {
        console.error("No version data found");
        throw new Error(`Invalid version: ${version}`);
      }

      console.log("Got version ID:", data.id);
      return data.id;
    } catch (error) {
      console.error("Error in getVersionId:", error);
      throw error;
    }
  }, [supabaseClient]);

  const getReferenceKey = useCallback(async (reference: BibleReference): Promise<string> => {
    const { data, error } = await supabaseClient
        .from('verse_references')
        .select('reference_key')
        .eq('book_name', reference.book)
        .eq('chapter_number', reference.chapter)
        .eq('verse_number', reference.verse)
        .single();

    if (error || !data) throw new Error('Could not generate reference key');
    return data.reference_key;
  }, [supabaseClient]);

  // Enhanced error types
  interface BibleError extends Error {
    code?: string;
    details?: string;
  }

// Fetch verse content with enhanced error handling
  const fetchVerseContent = useCallback(async () => {
    try {
      if (!readingState.currentBook || !readingState.currentChapter) {
        throw new Error('Missing required reading state');
      }

      if (readingState.currentRange) {
        // Fetch range content
        const {startReference: start, endReference: end} = readingState.currentRange;

        const startKey = await getReferenceKey(start);
        const endKey = await getReferenceKey(end);

        const {data: verses, error} = await supabaseClient
            .from('verses')
            .select(`
          id,
          verse_number,
          text,
          chapters!inner(
            chapter_number,
            books!inner(
              name,
              bible_version_id
            )
          )
        `)
            .in('chapters.books.bible_version_id', [await getVersionId(readingState.currentVersion)])
            .gte('reference_key', startKey)
            .lte('reference_key', endKey)
            .order('verse_number');

        if (error) {
          const bibleError: BibleError = new Error('Failed to fetch verses');
          bibleError.code = error.code;
          bibleError.details = error.message;
          throw bibleError;
        }

        // Update hasNextChapter and hasPreviousChapter
        const {data: nextChapter} = await supabaseClient
            .from('chapters')
            .select('id')
            .eq('book_id', verses[0].chapters.books.id)
            .eq('chapter_number', readingState.currentChapter + 1)
            .single();

        const {data: prevChapter} = await supabaseClient
            .from('chapters')
            .select('id')
            .eq('book_id', verses[0].chapters.books.id)
            .eq('chapter_number', readingState.currentChapter - 1)
            .single();

        setReadingState(prev => ({
          ...prev,
          hasNextChapter: !!nextChapter,
          hasPreviousChapter: !!prevChapter,
          loadedChapters: [...new Set([...prev.loadedChapters, readingState.currentChapter])]
        }));

        return verses;
      } else {
        // Fetch single verse/chapter
        const {data: verses, error} = await supabaseClient
            .from('verses')
            .select(`
              id,
              verse_number,
              text,
              chapters!inner(
                chapter_number,
                books!inner(
                  name,
                  bible_version_id
                )
              )
            `)
            .eq('chapters.books.name', readingState.currentBook)
            .eq('chapters.books.bible_version_id', await getVersionId(readingState.currentVersion))
            .eq('chapters.chapter_number', readingState.currentChapter)
            .order('verse_number');
        console.log('Before fetchVerseContent')
        console.log('after fetchVerseContent')

        if (error) throw error;
        return verses;
      }
    }catch (error) {
      console.error('Error fetching verse content:', error);
    }
    }, [readingState, supabaseClient, getVersionId, getReferenceKey]);

    // Query for verse content
    const {
      data: verseContent,
      isLoading,
      isError,
      error,
      isFetching
    } = useQuery({
      queryKey: ['verses', readingState.currentRange ?? readingState.currentReference],
      queryFn: () => fetchVerseContent(),
      cacheTime: CACHE_TIME,
      staleTime: STALE_TIME,
      enabled: Boolean(readingState.currentBook && readingState.currentChapter)
    });

    // Parse reference
    const parseReference = useCallback(async (reference: string): Promise<BibleReference> => {
      const parts = reference.split(' ');
      const book = parts.slice(0, -1).join(' ');
      const [chapter, verse] = parts[parts.length - 1].split(':').map(Number);

      // Validate reference against database
      const { data: bookData, error: bookError } = await supabaseClient
          .from('books')
          .select('id, chapter_count')
          .eq('name', book)
          .eq('bible_version_id', await getVersionId(readingState.currentVersion))
          .single();

      if (bookError || !bookData) {
        throw new Error(`Invalid book: ${book}`);
      }

      // Validate chapter and verse
      const { data: chapterData, error: chapterError } = await supabaseClient
          .from('chapters')
          .select('verse_count')
          .eq('book_id', bookData.id)
          .eq('chapter_number', chapter)
          .single();

      if (chapterError || !chapterData || verse > chapterData.verse_count) {
        throw new Error(`Invalid chapter or verse: ${chapter}:${verse}`);
      }

      return { book, chapter, verse };
    }, [readingState.currentVersion, supabaseClient, getVersionId]);

    // Navigation functions
    const goToReference = useCallback(async (reference: string) => {
      try {
        const parsedRef = await parseReference(reference);
        setReadingState(prev => ({
          ...prev,
          currentBook: parsedRef.book,
          currentChapter: parsedRef.chapter,
          currentVerse: parsedRef.verse,
          currentRange: null,
          history: [...prev.history.slice(0, prev.historyIndex + 1), reference],
          historyIndex: prev.historyIndex + 1
        }));
      } catch (error) {
        console.error('Error navigating to reference:', error);
      }
    }, [parseReference]);

    // Generate range
    const generateRange = useCallback(async (startRef: string, endRef: string): Promise<VerseRange> => {
      const start = await parseReference(startRef);
      const end = await parseReference(endRef);

      // Validate range order
      const startKey = await getReferenceKey(start);
      const endKey = await getReferenceKey(end);

      const { data: startData } = await supabaseClient
          .from('verse_references')
          .select('id')
          .eq('reference_key', startKey)
          .single();

      const { data: endData } = await supabaseClient
          .from('verse_references')
          .select('id')
          .eq('reference_key', endKey)
          .single();

      if (!startData || !endData || startData.id > endData.id) {
        throw new Error('Invalid range order');
      }

      return {
        startReference: start,
        endReference: end,
        referenceKey: `${startKey}-${endKey}`
      };
    }, [parseReference, getReferenceKey, supabaseClient]);

    // Set range
    const setRange = useCallback(async (startRef: string, endRef: string) => {
      try {
        const range = await generateRange(startRef, endRef);
        setReadingState(prev => ({
          ...prev,
          currentRange: range,
          history: [...prev.history.slice(0, prev.historyIndex + 1), `${startRef}-${endRef}`],
          historyIndex: prev.historyIndex + 1
        }));
      } catch (error) {
        console.error('Error setting range:', error);
      }
    }, [generateRange]);

    // History navigation
    const goBack = useCallback(() => {
      if (readingState.historyIndex > 0) {
        const newIndex = readingState.historyIndex - 1;
        const reference = readingState.history[newIndex];
        if (reference.includes('-')) {
          const [start, end] = reference.split('-');
          setRange(start, end);
        } else {
          goToReference(reference);
        }
        setReadingState(prev => ({
          ...prev,
          historyIndex: newIndex
        }));
      }
    }, [readingState.history, readingState.historyIndex, goToReference, setRange]);

    const goForward = useCallback(() => {
      if (readingState.historyIndex < readingState.history.length - 1) {
        const newIndex = readingState.historyIndex + 1;
        const reference = readingState.history[newIndex];
        if (reference.includes('-')) {
          const [start, end] = reference.split('-');
          setRange(start, end);
        } else {
          goToReference(reference);
        }
        setReadingState(prev => ({
          ...prev,
          historyIndex: newIndex
        }));
      }
    }, [readingState.history, readingState.historyIndex, goToReference, setRange]);

    // Version handling
    const changeVersion = useCallback(async (version: string) => {
      const versionId = await getVersionId(version);
      if (versionId) {
        setReadingState(prev => ({
          ...prev,
          currentVersion: version
        }));
      }
    }, [getVersionId]);

    // Initial data loading
    useEffect(() => {
      const loadInitialContent = async () => {
        if (defaultReference) {
          try {
            const parsedRef = await parseReference(defaultReference);
            setReadingState(prev => ({
              ...prev,
              currentBook: parsedRef.book,
              currentChapter: parsedRef.chapter,
              currentVerse: parsedRef.verse
            }));
          } catch (error) {
            console.error('Error loading initial reference:', error);
          }
        }
      };

      loadInitialContent();
    }, [defaultReference, parseReference]);

    // Utility functions with lodash
    const groupVersesByChapter = useCallback((verses: Verse[]) => {
      return _.groupBy(verses, verse => verse.chapter_id);
    }, []);

    const sortVerses = useCallback((verses: Verse[]) => {
      return _.orderBy(verses, ['chapter_id', 'verse_number'], ['asc', 'asc']);
    }, []);

    const filterVersesByRange = useCallback((verses: Verse[], range: VerseRange) => {
      return _(verses)
          .filter(verse => {
            const isAfterStart = verse.chapter_id >= range.startReference.chapter &&
                verse.verse_number >= range.startReference.verse;
            const isBeforeEnd = verse.chapter_id <= range.endReference.chapter &&
                verse.verse_number <= range.endReference.verse;
            return isAfterStart && isBeforeEnd;
          })
          .value();
    }, []);

    const debouncedGoToReference = useMemo(
        () => _.debounce(goToReference, 300),
        [goToReference]
    );

    // Chapter loading functions
    const loadNextChapter = useCallback(async () => {
      if (!readingState.hasNextChapter || isFetching) return;

      try {
        const nextChapterNum = readingState.currentChapter + 1;
        const { data: nextChapterVerses, error } = await supabaseClient
            .from('verses')
            .select(`
          id,
          verse_number,
          text,
          chapters!inner(
            chapter_number,
            books!inner(
              name,
              bible_version_id
            )
          )
        `)
            .eq('chapters.chapter_number', nextChapterNum)
            .eq('chapters.books.name', readingState.currentBook)
            .eq('chapters.books.bible_version_id', await getVersionId(readingState.currentVersion))
            .order('verse_number');

        if (error) throw error;

        // Append new verses to cache
        queryClient.setQueryData(
            ['verses', readingState.currentRange ?? readingState.currentReference],
            (oldData: any) => [...(oldData || []), ...nextChapterVerses]
        );

        setReadingState(prev => ({
          ...prev,
          loadedChapters: [...prev.loadedChapters, nextChapterNum]
        }));
      } catch (error) {
        console.error('Error loading next chapter:', error);
      }
    }, [readingState, readingState.hasNextChapter, isFetching, supabaseClient, getVersionId, queryClient]);

    const loadPreviousChapter = useCallback(async () => {
      if (!readingState.hasPreviousChapter || isFetching) return;

      try {
        const prevChapterNum = readingState.currentChapter - 1;
        const { data: prevChapterVerses, error } = await supabaseClient
            .from('verses')
            .select(`
          id,
          verse_number,
          text,
          chapters!inner(
            chapter_number,
            books!inner(
              name,
              bible_version_id
            )
          )
        `)
            .eq('chapters.chapter_number', prevChapterNum)
            .eq('chapters.books.name', readingState.currentBook)
            .eq('chapters.books.bible_version_id', await getVersionId(readingState.currentVersion))
            .order('verse_number');

        if (error) throw error;

        // Prepend new verses to cache
        queryClient.setQueryData(
            ['verses', readingState.currentRange ?? readingState.currentReference],
            (oldData: any) => [...prevChapterVerses, ...(oldData || [])]
        );

        setReadingState(prev => ({
          ...prev,
          loadedChapters: [prevChapterNum, ...prev.loadedChapters]
        }));
      } catch (error) {
        console.error('Error loading previous chapter:', error);
      }
    }, [readingState, readingState.hasPreviousChapter, isFetching, supabaseClient, getVersionId, queryClient]);

    return {
      // Loading states
      isLoading,        // True during initial load
      isFetching,       // True during background refetches
      isError,          // True if query encountered an error
      error,            // Error object if query failed

      // Current state
      currentVersion: readingState.currentVersion,
      currentReference: readingState.currentRange
          ? `${readingState.currentRange.startReference.book} ${readingState.currentRange.startReference.chapter}:${readingState.currentRange.startReference.verse}-${readingState.currentRange.endReference.book} ${readingState.currentRange.endReference.chapter}:${readingState.currentRange.endReference.verse}`
          : `${readingState.currentBook} ${readingState.currentChapter}:${readingState.currentVerse}`,
      currentRange: readingState.currentRange,

      // Content
      verseContent,

      // Navigation
      goToReference,
      debouncedGoToReference,
      goBack,
      goForward,
      canGoBack: readingState.historyIndex > 0,
      canGoForward: readingState.historyIndex < readingState.history.length - 1,

      // Range handling
      setRange,
      generateRange,
      filterVersesByRange,

      // Version handling
      changeVersion,

      // Utility functions
      groupVersesByChapter,
      sortVerses,

      // Parse functions
      parseReference,

      // Chapter loading
      loadNextChapter,
      loadPreviousChapter,
      hasNextChapter: readingState.hasNextChapter,
      hasPreviousChapter: readingState.hasPreviousChapter,
      loadedChapters: readingState.loadedChapters
    };
  }