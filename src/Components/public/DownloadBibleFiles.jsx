import { useState, useEffect } from "react";
import { supabase } from "./../../../supabaseClient";

const DownloadBibleFiles = ({ onLoadFile }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedFile, setSelectedFile] = useState(null); // File selected by user
    const [modalOpen, setModalOpen] = useState(false);
    const [fileContent, setFileContent] = useState(null); // Content of the user-selected file

    // Fetch CSV links from the database
    const fetchFiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("csv_links")
                .select("id, csv_type, csv_link, file_format, description, link_status");

            if (error) throw error;

            setFiles(data);
        } catch (error) {
            console.error("Error fetching files:", error.message);
            alert("Failed to fetch files.");
        } finally {
            setLoading(false);
        }
    };

    // Handle file upload from client device
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);

            // Read the file content
            const reader = new FileReader();
            reader.onload = (e) => {
                setFileContent(e.target.result); // Store the file content
            };
            reader.readAsText(file);
        }
    };

    // Handle file loading (either from URL or uploaded file)
    const handleLoadFile = async () => {
        if (selectedFile && fileContent) {
            try {
                // Process the file content
                if (onLoadFile) {
                    await onLoadFile({
                        csv_type: selectedFile.name,
                        file_format: "csv",
                        content: fileContent,
                    });
                }
                alert("File successfully loaded into the database.");
            } catch (error) {
                console.error("Error processing file:", error.message);
                alert("Failed to process the file.");
            }
        }
        closeModal();
    };

    // Open Modal
    const openModal = () => setModalOpen(true);

    // Close Modal
    const closeModal = () => {
        setSelectedFile(null);
        setFileContent(null);
        setModalOpen(false);
    };

    // Fetch files on component mount
    useEffect(() => {
        fetchFiles();
    }, []);

    // Filter files based on search query
    const filteredFiles = files.filter(
        (file) =>
            file.csv_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
            file.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Manage Bible Files</h1>

            {/* Search Bar */}
            <input
                type="text"
                className="form-input mt-2 mb-4 w-full"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* File Upload */}
            <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-2">
                    Upload a file from your device
                </label>
                <input
                    type="file"
                    accept=".csv"
                    className="form-input"
                    onChange={handleFileUpload}
                />
                {selectedFile && (
                    <p className="text-sm text-gray-600 mt-2">
                        Selected file: {selectedFile.name}
                    </p>
                )}
            </div>

            {loading ? (
                <p>Loading files...</p>
            ) : filteredFiles.length === 0 ? (
                <p>No files match your search query.</p>
            ) : (
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                    <tr>
                        <th className="border border-gray-300 px-4 py-2">Type</th>
                        <th className="border border-gray-300 px-4 py-2">Description</th>
                        <th className="border border-gray-300 px-4 py-2">Format</th>
                        <th className="border border-gray-300 px-4 py-2">Status</th>
                        <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filteredFiles.map((file) => (
                        <tr key={file.id}>
                            <td className="border border-gray-300 px-4 py-2">{file.csv_type}</td>
                            <td className="border border-gray-300 px-4 py-2">{file.description}</td>
                            <td className="border border-gray-300 px-4 py-2">{file.file_format}</td>
                            <td
                                className={`border border-gray-300 px-4 py-2 ${
                                    file.link_status === "Valid"
                                        ? "text-green-500"
                                        : "text-red-500"
                                }`}
                            >
                                {file.link_status}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                                {file.link_status !== "Valid" ? (
                                    <>
                                        {/* Download Button */}
                                        <a
                                            href={file.csv_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            download={file.csv_type.replace(/\s+/g, "_") + ".csv"}
                                            className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
                                        >
                                            Download
                                        </a>

                                        {/* Load Button */}
                                        <button
                                            onClick={() => openModal(file)}
                                            className="bg-green-500 text-white px-4 py-2 rounded"
                                        >
                                            Load
                                        </button>
                                    </>
                                ) : (
                                    <span className="text-gray-500">Unavailable</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* Modal */}
            {modalOpen && selectedFile && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <h2 className="text-xl font-bold mb-4">Load File: {selectedFile.name}</h2>
                        <p>
                            Are you sure you want to load the selected file into the database?
                        </p>
                        <div className="mt-6 flex justify-end space-x-4">
                            <button
                                onClick={handleLoadFile}
                                className="bg-green-500 text-white px-4 py-2 rounded"
                            >
                                Confirm
                            </button>
                            <button
                                onClick={closeModal}
                                className="bg-red-500 text-white px-4 py-2 rounded"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DownloadBibleFiles;
