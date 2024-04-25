import React, { useState, useEffect } from "react";
import cssText from "data-text:~style.css";
import type { PlasmoContentScript } from "plasmo";
import { TextSelected } from "~features/text-selected";

export const getStyle = () => {
  const style = document.createElement("style");
  style.textContent = cssText;
  return style;
}

const PlasmoOverlay = () => {
  // Estados para almacenar el texto seleccionado, los datos de análisis y el tipo de algoritmo
  const [selectedText, setSelectedText] = useState("");
  const [senpyData, setSenpyData] = useState(null);
  const [algorithm, setAlgorithm] = useState("");  // Estado para almacenar el tipo de algoritmo usado

  useEffect(() => {
    const messageListener = (message) => {
      if (message.type === "senpy-result") {
        console.log("Senpy Analysis Result:", message.senpyData);
        // Actualiza el estado con el texto seleccionado, los datos de análisis y el algoritmo
        setSelectedText(message.text);
        setSenpyData(message.senpyData.entries[0]);
        setAlgorithm(message.algorithm);  // Guardar el tipo de algoritmo
      }
    };

    chrome.runtime.onMessage.addListener(messageListener);

    // Limpiar el listener cuando el componente se desmonte
    return () => {
      chrome.runtime.onMessage.removeListener(messageListener);
    };
  }, []);

  return (
    <div className="plasmo-z-50 plasmo-flex plasmo-flex-col plasmo-fixed plasmo-top-32 plasmo-right-8 plasmo-space-y-4">
      <TextSelected selectedText={selectedText} senpyData={senpyData} algorithm={algorithm} />
    </div>
  );
};

export default PlasmoOverlay;
