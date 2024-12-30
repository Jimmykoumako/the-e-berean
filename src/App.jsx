import  { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';
import LinkManagement from "./Components/public/LinkManagement.jsx";
import LoadBibleData from "./Components/public/loadBibleData.jsx";
import DownloadBibleFiles from "./Components/public/DownloadBibleFiles.jsx";
import BibleDataUploader from "./Components/public/BibleDataUploader.jsx";
import BibleSearch from "./Components/public/BibleSearch.jsx";

function App() {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data, error } = await supabase.from('bible_versions').select('*');
                if (error) throw error;
                setData(data);
            } catch (err) {
                setError(err.message);
            }
        };
        fetchData();
        console.log(import.meta.env.VITE_SUPABASE_URL);

    }, []);

    const [versionId, setVersionId] = useState(1); // Example Bible version ID

    const handleComplete = () => {
        alert("All data has been loaded!");
    };

    const handleLoadFile = async (file) => {
        try {
            console.log("File being loaded:", file.csv_type);
            console.log("File content:", file.content);

            // TODO: Parse and insert the file content into the database
            alert(`Successfully loaded ${file.csv_type} into the database.`);
        } catch (error) {
            console.error("Error loading file:", error.message);
            alert("Failed to load the file.");
        }
    };

    return (
        // <div>
        //     <h1>Supabase Test</h1>
        //     {error ? <p>Error: {error}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
        // </div>
        <div>
            {/*<div className="p-8">*/}
            {/*    <h1 className="text-2xl font-bold mb-4">Bible Data Management</h1>*/}
            {/*    <LoadBibleData bibleVersionId={versionId} onComplete={handleComplete}/>*/}

            {/*</div>*/}
            {/*<DownloadBibleFiles  onLoadFile={handleLoadFile} />*/}
            {/*<BibleDataUploader />*/}
            <BibleSearch />
        </div>
    );
}

export default App;
