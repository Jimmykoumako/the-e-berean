import React from 'react';
import InlinePopup from './InlinePopup';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ExampleContainer = ({ title, children }) => (
    <Card className="mb-6">
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const InlinePopupExamples = () => {
    // Example handlers
    const handleViewInContext = (ref) => {
        console.log('View in context:', ref);
    };

    const handleBookmark = (ref) => {
        console.log('Bookmark:', ref);
    };

    const handleShare = (ref) => {
        console.log('Share:', ref);
    };

    const handleEdit = (ref) => {
        console.log('Edit:', ref);
    };

    // Example content references
    const verseRef = {
        id: '1',
        type: 'verse',
        content: 'For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.',
        reference: 'John 3:16',
        tags: ['salvation', 'love', 'eternal life'],
        crossReferences: ['1 John 4:9', 'Romans 5:8']
    };

    const noteRef = {
        id: '2',
        type: 'note',
        content: 'This verse is often considered the "gospel in a nutshell" as it summarizes the core message of Christianity.',
        title: 'Study Note on John 3:16',
        tags: ['study', 'important'],
        lastModified: '2024-01-17T12:00:00Z'
    };

    const crossRefRef = {
        id: '3',
        type: 'crossReference',
        content: 'In this was manifested the love of God toward us, because that God sent his only begotten Son into the world, that we might live through him.',
        reference: '1 John 4:9',
        tags: ['parallel', 'love of God']
    };

    return (
        <div className="space-y-8 p-4">
            {/* Basic Verse Example */}
            <ExampleContainer title="Basic Verse Reference">
                <p className="text-gray-600 mb-4">
                    Simple verse reference with default size and theme:
                </p>
                <p>
                    Jesus said: <InlinePopup
                    contentRef={verseRef}
                    onViewInContext={handleViewInContext}
                    onBookmark={handleBookmark}
                /> This famous verse...
                </p>
            </ExampleContainer>

            {/* Study Note Example */}
            <ExampleContainer title="Study Note Integration">
                <p className="text-gray-600 mb-4">
                    Integrating study notes within text:
                </p>
                <p>
                    John 3:16 is significant because <InlinePopup
                    contentRef={noteRef}
                    onEdit={handleEdit}
                    size="lg"
                /> Understanding this helps us...
                </p>
            </ExampleContainer>

            {/* Cross Reference Example */}
            <ExampleContainer title="Cross Reference Display">
                <p className="text-gray-600 mb-4">
                    Showing related verses with cross-references:
                </p>
                <p>
                    This theme is echoed in <InlinePopup
                    contentRef={crossRefRef}
                    onViewInContext={handleViewInContext}
                    theme="dark"
                /> showing the consistency...
                </p>
            </ExampleContainer>

            {/* Size Variations */}
            <ExampleContainer title="Size Variations">
                <div className="space-y-4">
                    <p>
                        Small: <InlinePopup
                        contentRef={verseRef}
                        size="sm"
                        onViewInContext={handleViewInContext}
                    />
                    </p>
                    <p>
                        Medium: <InlinePopup
                        contentRef={verseRef}
                        size="md"
                        onViewInContext={handleViewInContext}
                    />
                    </p>
                    <p>
                        Large: <InlinePopup
                        contentRef={verseRef}
                        size="lg"
                        onViewInContext={handleViewInContext}
                    />
                    </p>
                </div>
            </ExampleContainer>

            {/* Theme Variations */}
            <ExampleContainer title="Theme Variations">
                <div className="space-y-4">
                    <p>
                        Light theme: <InlinePopup
                        contentRef={verseRef}
                        theme="light"
                        onViewInContext={handleViewInContext}
                    />
                    </p>
                    <p>
                        Dark theme: <InlinePopup
                        contentRef={verseRef}
                        theme="dark"
                        onViewInContext={handleViewInContext}
                    />
                    </p>
                </div>
            </ExampleContainer>

            {/* Complex Integration Example */}
            <ExampleContainer title="Complex Integration">
                <p className="text-gray-600 mb-4">
                    Example of multiple popups in a study context:
                </p>
                <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Study on God's Love</h3>
                    <p className="mb-3">
                        The concept of divine love is powerfully expressed in <InlinePopup
                        contentRef={verseRef}
                        onViewInContext={handleViewInContext}
                        onBookmark={handleBookmark}
                    />. <InlinePopup
                        contentRef={noteRef}
                        onEdit={handleEdit}
                        size="lg"
                    />
                    </p>
                    <p>
                        This theme is further developed in <InlinePopup
                        contentRef={crossRefRef}
                        onViewInContext={handleViewInContext}
                        theme="light"
                    />, showing the consistent message of God's love throughout Scripture.
                    </p>
                </div>
            </ExampleContainer>

            {/* Interactive Features Example */}
            <ExampleContainer title="Interactive Features">
                <p className="text-gray-600 mb-4">
                    Demonstrating various interactive features:
                </p>
                <div className="space-y-4">
                    <p>
                        Bookmarkable verse: <InlinePopup
                        contentRef={verseRef}
                        onViewInContext={handleViewInContext}
                        onBookmark={handleBookmark}
                        onShare={handleShare}
                    />
                    </p>
                    <p>
                        Editable note: <InlinePopup
                        contentRef={noteRef}
                        onEdit={handleEdit}
                        onShare={handleShare}
                        size="lg"
                    />
                    </p>
                </div>
            </ExampleContainer>

            {/* Usage in Lists */}
            <ExampleContainer title="Usage in Lists">
                <p className="text-gray-600 mb-4">
                    Using popups in list contexts:
                </p>
                <ul className="list-disc list-inside space-y-2">
                    <li>
                        Primary verse: <InlinePopup
                        contentRef={verseRef}
                        onViewInContext={handleViewInContext}
                    />
                    </li>
                    <li>
                        Related insight: <InlinePopup
                        contentRef={noteRef}
                        onEdit={handleEdit}
                    />
                    </li>
                    <li>
                        Supporting verse: <InlinePopup
                        contentRef={crossRefRef}
                        onViewInContext={handleViewInContext}
                    />
                    </li>
                </ul>
            </ExampleContainer>

            {/* Contextual Use Cases */}
            <ExampleContainer title="Contextual Use Cases">
                <div className="space-y-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Sermon Notes</h4>
                        <p>
                            Key verse: <InlinePopup
                            contentRef={verseRef}
                            onViewInContext={handleViewInContext}
                            onBookmark={handleBookmark}
                        />
                            <br />
                            Commentary: <InlinePopup
                            contentRef={noteRef}
                            onEdit={handleEdit}
                        />
                        </p>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                        <h4 className="font-semibold mb-2">Study Group</h4>
                        <p>
                            Discussion point: <InlinePopup
                            contentRef={verseRef}
                            onViewInContext={handleViewInContext}
                            onShare={handleShare}
                        />
                            <br />
                            Group notes: <InlinePopup
                            contentRef={{
                                ...noteRef,
                                title: 'Group Discussion Note',
                                content: 'Points discussed during group study session...'
                            }}
                            onEdit={handleEdit}
                            onShare={handleShare}
                        />
                        </p>
                    </div>
                </div>
            </ExampleContainer>
        </div>
    );
};

export default InlinePopupExamples;