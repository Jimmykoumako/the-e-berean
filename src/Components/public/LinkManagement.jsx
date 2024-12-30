import { useState, useEffect } from "react";
import { supabase } from "./../../../supabaseClient";
import AddEditLink from "./AddEditLink";
import SaveFilesToStorage from "./SaveFilesToStorage.jsx";

const LinkManagement = () => {
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [linkToEdit, setLinkToEdit] = useState(null);
    const [showSaveFiles, setShowSaveFiles] = useState(false);

    const LOCAL_STORAGE_KEY = "bible_links";

    // Fetch Links from Supabase or Local Storage
    const fetchLinks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from("csv_links").select("*");
            if (error) throw error;

            setLinks(data);

            // Save to local storage
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Error fetching links:", error);

            // Fallback to Local Storage
            const localData = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (localData) {
                setLinks(JSON.parse(localData));
            } else {
                alert("No local data available.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Open Add/Edit Modal
    const openModal = (link = null) => {
        setLinkToEdit(link);
        setShowModal(true);
    };

    // Close Add/Edit Modal
    const closeModal = () => {
        setShowModal(false);
        setLinkToEdit(null);
        fetchLinks(); // Refresh after changes
    };

    // Delete a Link
    const deleteLink = async (id) => {
        if (!window.confirm("Are you sure you want to delete this link?")) return;

        try {
            const { error } = await supabase.from("csv_links").delete().eq("id", id);
            if (error) throw error;

            // Refresh Links
            fetchLinks();
            alert("Link deleted successfully.");
        } catch (error) {
            console.error("Error deleting link:", error);
        }
    };

    useEffect(() => {
        fetchLinks();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Link Management</h1>
            <button
                className="bg-green-500 text-white px-4 py-2 rounded mb-4"
                onClick={() => openModal()}
            >
                Add New Link
            </button>

            {loading ? (
                <p>Loading links...</p>
            ) : (
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead>
                    <tr>
                        <th className="border border-gray-300 px-4 py-2">CSV Type</th>
                        <th className="border border-gray-300 px-4 py-2">Description</th>
                        <th className="border border-gray-300 px-4 py-2">Status</th>
                        <th className="border border-gray-300 px-4 py-2">Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {links.map((link) => (
                        <tr key={link.id}>
                            <td className="border border-gray-300 px-4 py-2">
                                {link.csv_type}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                                {link.description}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                                {link.link_status}
                            </td>
                            <td className="border border-gray-300 px-4 py-2">
                                <button
                                    className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                                    onClick={() => openModal(link)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                    onClick={() => deleteLink(link.id)}
                                >
                                    Delete
                                </button>
                                <button
                                    className="bg-yellow-500 text-white px-4 py-2 rounded mb-4"
                                    onClick={() => setShowSaveFiles(true)}
                                >
                                    Save Files to Storage
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            )}

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-4 rounded shadow-lg">
                        <AddEditLink linkToEdit={linkToEdit} onComplete={closeModal} />
                        <button
                            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                            onClick={closeModal}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {showSaveFiles && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-4 rounded shadow-lg">
                        <SaveFilesToStorage links={links} onComplete={() => setShowSaveFiles(false)} />
                        <button
                            className="mt-4 bg-gray-500 text-white px-4 py-2 rounded"
                            onClick={() => setShowSaveFiles(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

        </div>
    );
};

export default LinkManagement;
