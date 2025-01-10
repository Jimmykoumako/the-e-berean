import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient.js';

const SaveFilesToStorage = () => {
    const [links, setLinks] = useState([]);
    const [uploading, setUploading] = useState(false);

    // Fallback to Local Storage
    const LOCAL_STORAGE_KEY = 'bible_links';

    // Fetch Links from Supabase
    const fetchLinks = async () => {
        try {
            const { data, error } = await supabase.from('csv_links').select('*');

            if (error) {
                throw error;
            }

            if (data) {
                setLinks(data);

                // Update Local Storage
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
            }
        } catch (error) {
            console.error('Error fetching from Supabase, falling back to local storage:', error);

            // Fallback to Local Storage
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
                setLinks(JSON.parse(localData));
            } else {
                alert('No local data available.');
            }
        }
    };

    // Save File to Supabase Storage
    const saveToStorage = async (link) => {
        setUploading(true);

        try {
            // Step 1: Download the file
            const response = await fetch(link.csv_link);
            if (!response.ok) {
                throw new Error('Failed to download file');
            }
            const fileBlob = await response.blob();

            // Step 2: Define the storage path
            const fileName = `${link.csv_type.toLowerCase()}_${link.id}.csv`;
            const storagePath = `bibles/${link.file_format}/${fileName}`;

            // Step 3: Upload to Supabase Storage
            const { data, error } = await supabase.storage
                .from('bibles')
                .upload(storagePath, fileBlob, {
                    contentType: 'text/csv',
                });

            if (error) {
                throw error;
            }

            // Step 4: Update the database
            await supabase
                .from('csv_links')
                .update({ storage_path: storagePath, link_status: 'Valid' })
                .eq('id', link.id);

            // Update State
            setLinks((prevLinks) =>
                prevLinks.map((l) =>
                    l.id === link.id ? { ...l, storage_path: storagePath, link_status: 'Valid' } : l
                )
            );

            // Update Local Storage
            const updatedLinks = links.map((l) =>
                l.id === link.id ? { ...l, storage_path: storagePath, link_status: 'Valid' } : l
            );
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedLinks));

            alert(`File saved to storage: ${storagePath}`);
        } catch (error) {
            console.error('Error saving file:', error);
            alert('Failed to save file');
        } finally {
            setUploading(false);
        }
    };

    // Fetch Links on Component Mount
    useEffect(() => {
        fetchLinks();
    }, []);

    return (
        <div>
            <h1>Save CSV Files to Storage</h1>
            {links.length === 0 ? (
                <p>Loading links...</p>
            ) : (
                links.map((link) => (
                    <div key={link.id}>
                        <strong>{link.csv_type}</strong>: {link.description} -{' '}
                        {link.link_status === 'Valid' ? '✅' : '❌'}{' '}
                        <button
                            onClick={() => saveToStorage(link)}
                            disabled={uploading || link.link_status === 'Valid'}
                        >
                            {uploading ? 'Uploading...' : 'Save to Storage'}
                        </button>
                    </div>
                ))
            )}
        </div>
    );
};

export default SaveFilesToStorage;
