
import  { useState, useEffect } from "react";
import { supabase } from "./../../../supabaseClient";
import toast, { Toaster } from "react-hot-toast"; // Notifications

const AddEditLink = ({ linkToEdit, onComplete }) => {
    const [csvLink, setCsvLink] = useState("");
    const [csvType, setCsvType] = useState("");
    const [description, setDescription] = useState("");
    const [fileFormat, setFileFormat] = useState("csv");
    const [isEditing, setIsEditing] = useState(false);
    const [validating, setValidating] = useState(false);

    // Populate fields if editing
    useEffect(() => {
        if (linkToEdit) {
            setCsvLink(linkToEdit.csv_link);
            setCsvType(linkToEdit.csv_type);
            setDescription(linkToEdit.description);
            setFileFormat(linkToEdit.file_format || "csv");
            setIsEditing(true);
        }
    }, [linkToEdit]);

    // Validate Link
    const validateLink = async () => {
        setValidating(true);
        try {
            const response = await fetch(csvLink, { method: "HEAD" });
            if (!response.ok) throw new Error("Invalid link or inaccessible.");
            toast.success("Link is valid!");
            return true;
        } catch (error) {
            toast.error("Link validation failed!");
            return false;
        } finally {
            setValidating(false);
        }
    };

    // Save Link
    const saveLink = async () => {
        const isValid = await validateLink();
        if (!isValid) return;

        const linkData = {
            csv_link: csvLink,
            csv_type: csvType,
            description,
            file_format: fileFormat,
            link_status: "Unchecked",
        };

        try {
            if (isEditing) {
                // Update Existing Link
                const { error } = await supabase
                    .from("csv_links")
                    .update(linkData)
                    .eq("id", linkToEdit.id);

                if (error) throw error;
                toast.success("Link updated successfully!");
            } else {
                // Add New Link
                const { error } = await supabase.from("csv_links").insert(linkData);

                if (error) throw error;
                toast.success("Link added successfully!");
            }

            // Notify Parent Component
            if (onComplete) onComplete();
        } catch (error) {
            toast.error("Failed to save link. Please try again.");
        }
    };

    return (
        <div className="max-w-md mx-auto p-4 bg-white shadow-lg rounded-lg">
            <Toaster />
            <h2 className="text-xl font-bold mb-4">
                {isEditing ? "Edit Link" : "Add New Link"}
            </h2>

            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">CSV Link</label>
                <input
                    type="url"
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter CSV link"
                    value={csvLink}
                    onChange={(e) => setCsvLink(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">CSV Type</label>
                <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="e.g., KJV"
                    value={csvType}
                    onChange={(e) => setCsvType(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">Description</label>
                <textarea
                    className="w-full p-2 border border-gray-300 rounded"
                    placeholder="Enter description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <div className="mb-4">
                <label className="block text-gray-700 font-bold mb-2">File Format</label>
                <select
                    className="w-full p-2 border border-gray-300 rounded"
                    value={fileFormat}
                    onChange={(e) => setFileFormat(e.target.value)}
                >
                    <option value="csv">CSV</option>
                    <option value="json">JSON</option>
                    <option value="xml">XML</option>
                </select>
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={validateLink}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    disabled={validating}
                >
                    {validating ? "Validating..." : "Validate Link"}
                </button>

                <button
                    onClick={saveLink}
                    className="bg-green-500 text-white px-4 py-2 rounded"
                >
                    Save
                </button>
            </div>
        </div>
    );
};

export default AddEditLink;
