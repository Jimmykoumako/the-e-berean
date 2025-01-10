import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const parseBibleReference = (query) => {
    const regex = /^(\d?\s*[a-zA-Z\s]+)\s*(\d+)(?::(\d+))?(?:-(\d+))?$/;
    const match = query.match(regex);

    if (match) {
        const [_, book, chapter, startVerse, endVerse] = match;
        return {
            type: 'reference',
            book: book.trim(),
            chapter: parseInt(chapter),
            startVerse: startVerse ? parseInt(startVerse) : null,
            endVerse: endVerse ? parseInt(endVerse) : null,
        };
    }
    return null;
};

const BibleSearch = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSearch = async () => {
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const supabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
            );

            const reference = parseBibleReference(query);
            let searchQuery = supabase
                .from('verses')
                .select(`
          id,
          verse_number,
          text,
          chapters:chapter_id(
            chapter_number,
            books:book_id(
              name
            )
          )
        `)
                .limit(20);

            if (reference) {
                searchQuery = searchQuery
                    .eq('chapters.books.name', reference.book)
                    .eq('chapters.chapter_number', reference.chapter);

                if (reference.startVerse) {
                    if (reference.endVerse) {
                        searchQuery = searchQuery
                            .gte('verse_number', reference.startVerse)
                            .lte('verse_number', reference.endVerse);
                    } else {
                        searchQuery = searchQuery.eq('verse_number', reference.startVerse);
                    }
                }
            } else {
                searchQuery = searchQuery.textSearch('search_vectors', query, { config: 'english' });
            }

            const { data, error: searchError } = await searchQuery;
            if (searchError) throw searchError;

            setResults(data || []);
        } catch (err) {
            setError('Search failed. Please try again.');
            console.error('Search error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '600px', margin: 'auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ marginBottom: '10px' }}>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by keyword or reference (e.g., 'love' or 'John 3:16')"
                    style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '16px',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        marginBottom: '10px',
                    }}
                />
                <button
                    onClick={handleSearch}
                    disabled={isLoading}
                    style={{
                        padding: '10px 20px',
                        fontSize: '16px',
                        backgroundColor: '#007BFF',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                    }}
                >
                    {isLoading ? 'Searching...' : 'Search'}
                </button>
            </div>

            {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

            <div>
                {results.length > 0 ? (
                    results.map((verse) => (
                        <div
                            key={verse.id}
                            style={{
                                border: '1px solid #ddd',
                                padding: '10px',
                                marginBottom: '10px',
                                borderRadius: '4px',
                            }}
                        >
                            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                                {verse.chapters.books.name} {verse.chapters.chapter_number}:{verse.verse_number}
                            </div>
                            <div>{verse.text}</div>
                        </div>
                    ))
                ) : (
                    !isLoading && query && <div style={{ color: '#666' }}>No results found for "{query}".</div>
                )}

                {isLoading && <div style={{ color: '#666' }}>Searching...</div>}
            </div>
        </div>
    );
};

export default BibleSearch;
