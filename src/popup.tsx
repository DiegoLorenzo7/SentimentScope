import React, { useEffect, useState } from "react";
import { TextSelected } from "~features/text-selected";
import cssText from "data-text:~style.css";

export const getStyle = () => {
    const style = document.createElement("style");
    style.textContent = cssText;
    return style;
};

const IndexPopup = () => {
    const [senpyData, setSenpyData] = useState(null);
    const [selectedText, setSelectedText] = useState("");

    useEffect(() => {
        const messageListener = (message) => {
            if (message.type === "senpy-result") {
                console.log("Senpy Analysis Result:", message.senpyData);
                setSelectedText(message.text);
                setSenpyData(message.senpyData.entries[0]);
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    return (
        <div className="plasmo-z-50 plasmo-flex plasmo-flex-col plasmo-fixed plasmo-top-32 plasmo-right-8 plasmo-space-y-4">
            <TextSelected />
        </div>
    );
};

export default IndexPopup;