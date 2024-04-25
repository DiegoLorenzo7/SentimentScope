import React, { useState, useEffect } from "react";

export const TextSelected = () => {
    const [selectedText, setSelectedText] = useState("");
    const [senpyData, setSenpyData] = useState(null);

    useEffect(() => {
        const messageListener = (message) => {
            if (message.type === "senpy-result") {
                setSelectedText(message.text);  // Usamos el texto seleccionado que se pasa desde el background
                setSenpyData(message.senpyData.entries[0]);  
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => chrome.runtime.onMessage.removeListener(messageListener);
    }, []);

    return (
        <div>
            <textarea value={selectedText} readOnly rows={3} />
            {senpyData && senpyData['marl:hasOpinion'] && (
                <div>
                    <h3>Resultados del análisis:</h3>
                    {senpyData['marl:hasOpinion'].map((opinion, index) => (
                        <p key={index}>Sentimiento: {opinion['marl:hasPolarity'].split(':').pop()} </p>
                    ))}
                </div>
            )}
        </div>
    );
};