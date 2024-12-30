import { useState, useEffect } from "react";
import { supabase } from "./../../../supabaseClient";

const SelectBibleVersion = ({ onSelect }) => {
    const [versions, setVersions] = useState([]);
    const [selectedVersion, setSelectedVersion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch Bible versions from the database
    const fetchBibleVersions = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("bible_versions")
                .select("id, version_name");
            if (error) throw error;

            setVersions(data);
        } catch (err) {
            console.error("Error fetching Bible versions:", err.message);
            setError("Failed to load Bible versions.");
        } finally {
            setLoading(false);
        }
    };

    // Handle version selection
    const handleSelectChange = (event) => {
        const versionId = event.target.value;
        setSelectedVersion(versionId);
        if (onSelect) {
            onSelect(versionId); // Pass the selected ID to the parent component
        }
    };

    useEffect(() => {
        fetchBibleVersions();
    }, []);

    return (
        <div className="mb-6">
            <label className="block text-gray-700 font-bold mb-2" htmlFor="bible-version">
                Select Bible Version
            </label>
            {loading ? (
                <p>Loading Bible versions...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <select
                    id="bible-version"
                    className="form-select w-full border rounded p-2"
                    value={selectedVersion || ""}
                    onChange={handleSelectChange}
                >
                    <option value="" disabled>
                        -- Select a Bible Version --
                    </option>
                    {versions.map((version) => (
                        <option key={version.id} value={version.id}>
                            {version.version_name}
                        </option>
                    ))}
                </select>
            )}
        </div>
    );
};

export default SelectBibleVersion;
