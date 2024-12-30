import { useState } from "react";
import SelectBibleVersion from "./SelectBibleVersion";
import LoadBibleData from "./LoadBibleData";

const BibleDataUploader = () => {
    const [bibleVersionId, setBibleVersionId] = useState(null);

    return (
        <div className="max-w-4xl mx-auto p-4 bg-white shadow-lg rounded-lg">
            <h1 className="text-2xl font-bold mb-6">Bible Data Uploader</h1>

            {/* Step 1: Select Bible Version */}
            <SelectBibleVersion onSelect={(id) => setBibleVersionId(id)} />

            {/* Step 2: Load Bible Data */}
            {bibleVersionId ? (
                <LoadBibleData bibleVersionId={bibleVersionId} />
            ) : (
                <p className="text-gray-600">Please select a Bible version to continue.</p>
            )}
        </div>
    );
};

export default BibleDataUploader;
