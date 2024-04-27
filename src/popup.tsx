import React, { useEffect, useState } from "react";
import { TextSelected } from "~features/text-selected";
import cssText from "data-text:~style.css";
import "./style.css"




const IndexPopup = () => {
    const [selectedText, setSelectedText] = useState("");
    const [senpyData, setSenpyData] = useState(null);
    const [algorithm, setAlgorithm] = useState("");

    useEffect(() => {
        chrome.runtime.sendMessage({ type: "request-latest-analysis" }, (response) => {
            if (response) {
                setSelectedText(response.text);
                setSenpyData(response.senpyData.entries[0]);      
                setAlgorithm(response.algorithm);
            }
        });
    }, []);

    return (
<div className="px-16 py-16 bg-gradient-to-br from-gray-800 via-black-800 to-black-900 shadow-2xl rounded-xl text-white text-lg">
            <TextSelected selectedText={selectedText} senpyData={senpyData} algorithm={algorithm} />
        </div>
    );
    
};

export default IndexPopup;
