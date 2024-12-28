import  { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

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

    return (
        <div>
            <h1>Supabase Test</h1>
            {error ? <p>Error: {error}</p> : <pre>{JSON.stringify(data, null, 2)}</pre>}
        </div>
    );
}

export default App;
