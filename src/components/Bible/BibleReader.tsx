import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { useBibleReading } from '@/hooks/useBibleReading';
import { useInView } from 'react-intersection-observer';
import { ChevronUp, Book, Settings, Share2, Bookmark } from 'lucide-react';
import {supabase} from "../../../supabaseClient";

const BibleReader = () => {
    // State management
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const [showSettings, setShowSettings] = useState(false);
    const [fontSize, setFontSize] = useState('text-base');
    const scrollRef = useRef(null);

    const { ref: bottomRef, inView } = useInView({
        threshold: 0
    });

    // Bible reading hook with configuration
    const {
        verseContent,
        isLoading,
        isFetching,
        isError,
        error,
        currentReference,
        currentVersion,
        loadNextChapter,
        loadPreviousChapter,
        hasNextChapter,
        hasPreviousChapter,
        changeVersion,
        goToReference,
    } = useBibleReading({
        defaultVersion: 'KJV',
        defaultReference: 'John 3:16',
        supabaseClient: supabase
    });

    // Infinite scroll handler
    useEffect(() => {
        if (inView && hasNextChapter && !isFetching) {
            loadNextChapter();
        }
    }, [inView, hasNextChapter, isFetching]);

    // Loading state
    if (isLoading) {
        return (
            <Card className="p-6 max-w-4xl mx-auto">
                <div className="animate-pulse space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex space-x-2">
                            <div className="h-4 w-8 bg-gray-200 rounded" />
                            <div className="h-4 bg-gray-200 rounded w-full" />
                        </div>
                    ))}
                </div>
            </Card>
        );
    }

    // Error state
    if (isError) {
        return (
            <Card className="p-6 max-w-4xl mx-auto bg-red-50">
                <div className="text-red-600">
                    <h3 className="text-lg font-semibold">Error Loading Content</h3>
                    <p className="mt-2">{error?.message || 'An unknown error occurred'}</p>
                    <button
                        onClick={() => goToReference(currentReference)}
                        className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Retry
                    </button>
                </div>
            </Card>
        );
    }

    return (
        <div className="relative max-w-4xl mx-auto" ref={scrollRef}>
            {/* Header */}
            <Card className="sticky top-0 z-10 mb-4">
                <div className="p-4 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Book className="h-6 w-6" />
                        <h2 className="text-xl font-semibold">{currentReference}</h2>
                    </div>

                    <div className="flex items-center space-x-4">
                        <button
                            onClick={() => setShowSettings(!showSettings)}
                            className="p-2 hover:bg-gray-100 rounded-full"
                        >
                            <Settings className="h-5 w-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <Share2 className="h-5 w-5" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full">
                            <Bookmark className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Settings panel */}
                {showSettings && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium">Version:</label>
                                    <select
                                        value={currentVersion}
                                        onChange={(e) => changeVersion(e.target.value)}
                                        className="p-1 border rounded"
                                    >
                                        <option value="KJV">King James Version</option>
                                        <option value="NIV">New International Version</option>
                                        <option value="ESV">English Standard Version</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium">Font Size:</label>
                                    <select
                                        value={fontSize}
                                        onChange={(e) => setFontSize(e.target.value)}
                                        className="p-1 border rounded"
                                    >
                                        <option value="text-sm">Small</option>
                                        <option value="text-base">Medium</option>
                                        <option value="text-lg">Large</option>
                                        <option value="text-xl">Extra Large</option>
                                    </select>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        id="autoScroll"
                                        checked={autoScrollEnabled}
                                        onChange={(e) => setAutoScrollEnabled(e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <label htmlFor="autoScroll" className="text-sm font-medium">
                                        Auto-scroll to current verse
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </Card>

            {/* Loading indicator */}
            {isFetching && !isLoading && (
                <div className="fixed top-0 left-0 right-0 z-50">
                    <div className="h-1 bg-blue-500 animate-pulse" />
                </div>
            )}

            {/* Previous chapter loader */}
            {hasPreviousChapter && (
                <div className="text-center mb-4">
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
            <Card className="mb-4">
                <div className="p-6 space-y-4">
                    {verseContent?.map((verse) => (
                        <div
                            key={verse.id}
                            id={`verse-${verse.verse_number}`}
                            className={`flex group ${fontSize} hover:bg-gray-50 rounded p-2 transition-colors duration-200`}
                        >
              <span className="font-medium text-gray-500 mr-4 select-none w-8">
                {verse.verse_number}
              </span>
                            <p className="flex-1">{verse.text}</p>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Infinite scroll trigger */}
            {hasNextChapter && (
                <div ref={bottomRef} className="text-center mb-4">
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
                className="fixed bottom-4 right-4 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
            >
                <ChevronUp className="h-5 w-5" />
            </button>
        </div>
    );
};

export default BibleReader;