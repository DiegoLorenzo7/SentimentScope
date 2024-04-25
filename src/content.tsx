import React, { useState, useEffect } from "react";
import cssText from "data-text:~style.css";
import { TextSelected } from "~features/text-selected";

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
}

const PlasmoOverlay = () => {
  const [selectedText, setSelectedText] = useState("");
  const [senpyData, setSenpyData] = useState(null);
  const [algorithm, setAlgorithm] = useState("");  

  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === "senpy-result") {
        console.log("Senpy Analysis Result:", message.senpyData);
        setSelectedText(message.text);
        setSenpyData(message.senpyData.entries[0]);
        setAlgorithm(message.algorithm);  
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  //return (
   // <div className="z-50 flex flex-col fixed top-30 right-8 space-y-4 bg-gray-800 text-blue-500 p-4 rounded-lg shadow-lg">
     //   <TextSelected selectedText={selectedText} senpyData={senpyData} algorithm={algorithm} />
    //</div>
//);

};

export default PlasmoOverlay;
