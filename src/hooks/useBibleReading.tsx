import {useState, useCallback, useEffect, useMemo} from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import _ from 'lodash';
import {supabase} from "../../supabaseClient";

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

interface Chapter {
  id: number;
  book_id: number;
  chapter_number: number;
  verse_count: number;
  title?: string;
  theme?: string;
}

interface Book {
  id: number;
  bible_version_id: number;
  name: string;
  code_name: string;
  order_in_version: number;
  chapter_count: number;
}

interface UseBibleReadingProps {
  defaultVersion?: string;
  defaultReference?: string;
  supabaseClient: SupabaseClient;
}

interface ReadingState {
  currentVersion: string;
  currentBook: string;
  currentChapter: number;
  currentVerse: number;
  currentRange: VerseRange | null;
  history: string[];
  historyIndex: number;
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



  // Query for current verse/range content

  // Utility functions
  const getVersionId = useCallback(async (version: string): Promise<number> => {
    const { data, error } = await supabaseClient
        .from('bible_versions')
        .select('id')
        .eq('abbreviation', version)
        .single();

    if (error || !data) throw new Error(`Invalid version: ${version}`);
    return data.id;
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

  // Fetch verse content
  const fetchVerseContent = useCallback(async () => {
    console.log(readingState.currentRange)
    console.log(readingState.currentReference)
    console.log("Called: fetchVerseContent")
    // Early return if we don't have required data
    if (!readingState.currentBook || !readingState.currentChapter) {
      throw new Error('Missing required reading state');
    }

    if (readingState.currentRange) {
      // Fetch range content
      const { startReference: start, endReference: end } = readingState.currentRange;

      const startKey = await getReferenceKey(start);
      const endKey = await getReferenceKey(end);
      console.log("Called: fetchVerseContent before SUPABASE")

      const { data: verses, error } = await supabaseClient
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

      if (error) throw error;
      console.log("Called: The verse if")
      console.log(verses)
      return verses;
    } else {
      console.log("Called: fetchVerseContent the Else situation")

      // Fetch entire chapter
      const { data: verses, error } = await supabase
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
          .eq('chapters.chapter_number', readingState.currentChapter)
          .eq('chapters.books.name', readingState.currentBook)
          .eq('chapters.books.bible_version_id', await getVersionId(readingState.currentVersion))
          .order('verse_number');

      if (error) throw error;
      console.log("Called: The verse else")

      console.log(verses)
      return verses;
    }
  }, [readingState, supabaseClient]);

  // Query for verse content
  const { data: verseContent, isLoading } = useQuery({
    queryKey: ['verses', readingState.currentRange ?? readingState.currentReference],
    queryFn: () => fetchVerseContent(),
    cacheTime: CACHE_TIME,
    staleTime: STALE_TIME,
    enabled: Boolean(readingState.currentBook && readingState.currentChapter && readingState.currentVerse)
  });

  // Helper function to generate reference key
  const generateReferenceKey = useCallback((reference: BibleReference): string => {
    return `${reference.book}_${reference.chapter}_${reference.verse}`;
  }, []);

  // Parse a reference string into structured format
  const parseReference = useCallback(async (reference: string): Promise<BibleReference> => {
    const parts = reference.split(' ');
    const book = parts.slice(0, -1).join(' ');
    const [chapter, verse] = parts[parts.length - 1].split(':').map(Number);
    console.log("ParseRef got called")

    // Validate reference against database
    const { data: bookData, error: bookError } = await supabaseClient
        .from('books')
        .select('id, chapter_count')
        .eq('name', book)
        .eq('bible_version_id', await getVersionId(readingState.currentVersion))
        .single();
    console.log("Fetching from supabase")

  console.log(bookData)

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

    console.log({ book, chapter, verse })
    return { book, chapter, verse };
  }, [readingState.currentVersion, supabaseClient]);

console.log("Hello")
console.log(defaultReference)

  // Query for current verse/range content
  const loadInitialContent = async () => {
    console.log("Run loadInitialContent")
    if (defaultReference) {
      console.log("defaultReference", defaultReference)
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

  loadInitialContent().then(()=>{
    console.log(readingState)
    console.log(isLoading)
    console.log(verseContent)
  });

  // Initial data loading
  // Initial data loading
  useEffect(() => {
    const loadInitialContent = async () => {
      console.log("Run loadInitialContent in useEffect")
      if (defaultReference) {
        try {
          const parsedRef = await parseReference(defaultReference);
          setReadingState(prev => ({
            ...prev,
            currentBook: parsedRef.book,
            currentChapter: parsedRef.chapter,
            currentVerse: parsedRef.verse
          }));
          console.log(parsedRef)
        } catch (error) {
          console.error('Error loading initial reference:', error);
        }
      }
    };

    loadInitialContent();
  }, [defaultReference, parseReference]);

  // Generate a verse range
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
  }, [parseReference, supabaseClient]);


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

  // Range handling functions
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
  }, []);





  // Lodash utility functions
  const groupVersesByChapter = useCallback((verses: Verse[]) => {
    return _.groupBy(verses, verse => verse.chapter_id);
  }, []);

  const sortVerses = useCallback((verses: Verse[]) => {
    return _.orderBy(verses, ['chapter_id', 'verse_number'], ['asc', 'asc']);
  }, []);

  const mergeRanges = useCallback((ranges: VerseRange[]) => {
    return _(ranges)
        .sortBy(range => range.startReference.chapter)
        .reduce((result: VerseRange[], range) => {
          const lastRange = _.last(result);
          if (!lastRange || lastRange.endReference.verse < range.startReference.verse - 1) {
            result.push(range);
          } else {
            lastRange.endReference = range.endReference;
          }
          return result;
        }, []);
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

  const getPaginatedVerses = useCallback((verses: Verse[], pageSize: number = 20) => {
    return _.chunk(verses, pageSize);
  }, []);

  const groupVersesByBook = useCallback((verses: Verse[]) => {
    return _.groupBy(verses, verse => verse.chapters?.books?.name);
  }, []);

  const generateReadingStats = useCallback((verses: Verse[]) => {
    return {
      totalVerses: verses.length,
      versesPerChapter: _.countBy(verses, 'chapter_id'),
      averageVerseLength: _.meanBy(verses, verse => verse.text.length),
      chapterDistribution: _.groupBy(verses, 'chapter_id')
    };
  }, []);

  const debouncedGoToReference = useMemo(
      () => _.debounce(goToReference, 300),
      [goToReference]
  );

  return {
    // Current state
    currentVersion: readingState.currentVersion,
    currentReference: readingState.currentRange
        ? `${readingState.currentRange.startReference.book} ${readingState.currentRange.startReference.chapter}:${readingState.currentRange.startReference.verse}-${readingState.currentRange.endReference.book} ${readingState.currentRange.endReference.chapter}:${readingState.currentRange.endReference.verse}`
        : `${readingState.currentBook} ${readingState.currentChapter}:${readingState.currentVerse}`,
    currentRange: readingState.currentRange,

    // Content
    verseContent,
    isLoading,

    // Navigation
    goToReference,
    debouncedGoToReference,
    goBack,
    goForward,
    canGoBack: readingState.historyIndex > 0,
    canGoForward: readingState.historyIndex < readingState.history.length - 1,

    // Range handling
    setRange,
    parseReference,
    generateRange,
    mergeRanges,
    filterVersesByRange,

    // Version handling
    changeVersion,

    // Utility functions
    generateReferenceKey,
    getReferenceKey,

    // Data organization
    groupVersesByChapter,
    groupVersesByBook,
    sortVerses,

    // Pagination and stats
    getPaginatedVerses,
    generateReadingStats
  };
}