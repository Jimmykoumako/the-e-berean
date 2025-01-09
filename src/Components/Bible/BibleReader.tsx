import { useEffect, useRef, useState } from 'react';
import { useBibleReading } from '@/hooks/useBibleReading';
import { useInView } from 'react-intersection-observer';
import { supabase } from '../../../supabaseClient';

const SCROLL_OFFSET = -100; // Offset for scroll position

const BibleReader = () => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const { ref: bottomRef, inView } = useInView({
        threshold: 0
    });

    const {
        verseContent,
        isLoading,
        isFetching,
        isError,
        error,
        currentReference,
        currentVersion,
        currentVerse,
        goToReference,
        changeVersion,
        loadNextChapter,
        loadPreviousChapter,
        hasNextChapter,
        hasPreviousChapter
    } = useBibleReading({
        defaultVersion: 'KJV',
        defaultReference: 'John 3:16',
        supabaseClient: supabase
    });

    // Automatic scrolling to current verse
    useEffect(() => {
        if (autoScrollEnabled && !isLoading && verseContent && scrollRef.current) {
            const verseElement = document.getElementById(`verse-${currentVerse}`);
            if (verseElement) {
                verseElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        }
    }, [currentVerse, isLoading, verseContent, autoScrollEnabled]);

    // Infinite scroll handling
    useEffect(() => {
        if (inView && hasNextChapter && !isFetching) {
            loadNextChapter();
        }
    }, [inView, hasNextChapter, isFetching]);

    // Error states with retry logic
    const handleRetry = () => {
        if (currentReference) {
            goToReference(currentReference);
        }
    };

    // Loading states
    if (isLoading) {
        return (
            <div className="p-4">
                <div className="animate-pulse space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex space-x-2">
                            <div className="h-4 w-8 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error handling with detailed messages
    if (isError) {
        return (
            <div className="p-4 border rounded-lg bg-red-50">
                <h3 className="text-lg font-semibold text-red-700">Error Loading Bible Content</h3>
                <p className="text-red-600 mt-2">{error?.message || 'An unknown error occurred'}</p>
                <div className="mt-4">
                    <button
                        onClick={handleRetry}
                        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative" ref={scrollRef}>
            {/* Header with controls */}
            <div className="sticky top-0 bg-white border-b p-4 z-10">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">{currentReference}</h2>
                    <div className="flex space-x-4 items-center">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={autoScrollEnabled}
                                onChange={(e) => setAutoScrollEnabled(e.target.checked)}
                                className="form-checkbox"
                            />
                            <span>Auto-scroll</span>
                        </label>
                        <select
                            value={currentVersion}
                            onChange={(e) => changeVersion(e.target.value)}
                            disabled={isFetching}
                            className="p-2 border rounded"
                        >
                            <option value="KJV">King James Version</option>
                            <option value="NIV">New International Version</option>
                            <option value="ESV">English Standard Version</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Loading indicator for background updates */}
            {isFetching && !isLoading && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-1 bg-blue-500 animate-pulse"></div>
                </div>
            )}

            {/* Previous chapter loader */}
            {hasPreviousChapter && (
                <div className="p-4 text-center">
                    <button
                        onClick={loadPreviousChapter}
                        disabled={isFetching}
                        className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                        Load Previous Chapter
                    </button>
                </div>
            )}

            {/* Main content */}
            <div className="p-4 space-y-4">
                {verseContent?.map((verse) => (
                    <div
                        key={verse.id}
                        id={`verse-${verse.verse_number}`}
                        className={`flex transition-colors duration-300 p-2 rounded ${
                            verse.verse_number === currentVerse ? 'bg-yellow-50' : ''
                        }`}
                    >
            <span className="font-semibold mr-2 text-gray-500 select-none w-8">
              {verse.verse_number}
            </span>
                        <p className="flex-1">{verse.text}</p>
                    </div>
                ))}
            </div>

            {/* Infinite scroll trigger */}
            {hasNextChapter && (
                <div ref={bottomRef} className="p-4 text-center">
                    {isFetching ? (
                        <div className="animate-pulse">Loading more verses...</div>
                    ) : (
                        <button
                            onClick={loadNextChapter}
                            className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
                        >
                            Load Next Chapter
                        </button>
                    )}
                </div>
            )}

            {/* Scroll to top button */}
            <button
                onClick={() => scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
                className="fixed bottom-4 right-4 bg-blue-500 text-white p-2 rounded-full shadow-lg hover:bg-blue-600"
            >
                ↑
            </button>
        </div>
    );
};

export default BibleReader;