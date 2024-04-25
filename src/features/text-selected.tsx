import React from "react";

export const TextSelected = ({ selectedText, senpyData, algorithm }) => {
    const renderResults = () => {
        if (!senpyData || !algorithm) {
            return <div>No hay datos para analizar.</div>;
        }

        if (algorithm === "sentiment140" && senpyData['marl:hasOpinion']) {
            return (
                <div>
                    <h3>Resultados de los análisis con Sentiment140:</h3>
                    {senpyData['marl:hasOpinion'].map((opinion, index) => (
                        <p key={index}>Sentiment: {opinion['marl:hasPolarity'].split(':').pop()}</p>
                    ))}
                </div>
            );
        } else if (algorithm === "sentiment-vader") {
            return (
                <div>
                    <h3>Resultados de los análisis con VADER:</h3>
                    {senpyData['marl:hasOpinion'].map((opinion, index) => (
                        <p key={index}>
                            {opinion['marl:hasPolarity'].split(':').pop()}: {opinion['marl:polarityValue']}
                        </p>
                    ))}
                </div>
            );
        }

        return <div>Please select a text and an analysis type.</div>;
    };

    return (
        <div>
            <textarea value={selectedText} readOnly rows={3} />
            {renderResults()}
        </div>
    );
};