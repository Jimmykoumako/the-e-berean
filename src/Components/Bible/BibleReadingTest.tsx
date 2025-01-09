import {useCallback, useEffect} from 'react';
import {useBibleReading} from "@/hooks/useBibleReading";
import {supabase} from "../../../supabaseClient";

const BibleReadingTest = () => {
    console.log("Rendering BibleReadingTest component");

    // const {
    //     verseContent,
    //     isLoading,
    //     currentReference,
    //     parseReference,
    // } = useBibleReading({
    //     defaultVersion: 'KJV',
    //     defaultReference: 'John 3:16',
    //     supabaseClient: supabase
    // });

    useEffect(() => {
        console.log('testConnection')
        const testConnection = async () => {
            try {
                // Check if you have the right permissions
                const { data: versionData, error: versionError } = await supabase
                    .from('bible_versions')
                    .select('*')
                    .limit(1);

                console.log("Permission test:", { versionData, versionError });
                const { data, error } =  supabase.from('bible_versions').select('count');
                console.log("Connection test:", { data, error });
            } catch (err) {
                console.error("Connection error:", err);
            }
        };
        testConnection();
    }, []);

    // // Log state changes
    // useEffect(() => {
    //     console.log("Current loading state:", isLoading);
    // }, [isLoading]);
    //
    // useEffect(() => {
    //     console.log("Current verse content:", verseContent);
    // }, [verseContent]);
    //
    // useEffect(() => {
    //     console.log("Current reference:", currentReference);
    // }, [currentReference]);



    // // Test parseReference
    // useEffect(() => {
    //
    //     const testParse = async () => {
    //         console.log("testParse")
    //         const version = 'KJV'
    //         try {
    //             console.log("Right before testParse")
    //
    //             const { data, error } = await supabase
    //                 .from('bible_versions')
    //                 .select('id')
    //                 // .eq('abbreviation', version)
    //                 // .single();
    //             console.log("Right after testParse")
    //
    //             if (error) {
    //                 console.error("Error getting version ID:", error);
    //                 throw error;
    //             }
    //
    //             if (!data) {
    //                 console.error("No version data found");
    //                 throw new Error(`Invalid version: ${version}`);
    //             }
    //
    //             console.log("Got version ID:", data.id);
    //             const result = await parseReference('John 3:16');
    //             console.log("Parse test result:", result);
    //         } catch (error) {
    //             console.error("Parse test error:", error);
    //         }
    //     };
    //     testParse();
    // }, [parseReference]);

    // if (isLoading) {
    //     console.log("Rendering loading state");
    //     return <div>Loading...</div>;
    // }
    //
    // if (!verseContent) {
    //     console.log("No verse content available");
    //     return <div>No content available</div>;
    // }

    console.log("Rendering verse content");
    return (
        <div>
            {/*<h2>{currentReference}</h2>*/}
            {/*{verseContent.map(verse => (*/}
            {/*    <div key={verse.id}>*/}
            {/*        <span>{verse.verse_number}</span>*/}
            {/*        <span>{verse.text}</span>*/}
            {/*    </div>*/}
            {/*))}*/}
        </div>
    );
};

export default BibleReadingTest;