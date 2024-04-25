import React, { useEffect, useState } from "react";
import { TextSelected } from "~features/text-selected";
import cssText from "data-text:~style.css";

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = cssText;
    return style;
};

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
        <div className="plasmo-z-50 plasmo-flex plasmo-flex-col plasmo-fixed plasmo-top-30 plasmo-right-8 plasmo-space-y-4">
            <TextSelected selectedText={selectedText} senpyData={senpyData} algorithm={algorithm} />
        </div>
    );
};

export default IndexPopup;
