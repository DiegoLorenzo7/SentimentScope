import React from "react";
import { Doughnut } from 'react-chartjs-2';
import 'chart.js/auto';

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
        } else if (algorithm === "sentiment-vader" && senpyData['marl:hasOpinion']) {
            const polarityCounts = senpyData['marl:hasOpinion'].reduce((acc, opinion) => {
                const polarity = opinion['marl:hasPolarity'].split(':').pop();
                acc[polarity] = (acc[polarity] || 0) + parseFloat(opinion['marl:polarityValue']);
                return acc;
            }, {});

            const data = {
                labels: ['Positive', 'Negative', 'Neutral'],
                datasets: [
                    {
                        data: [polarityCounts.Positive || 0, polarityCounts.Negative || 0, polarityCounts.Neutral || 0],
                        backgroundColor: ['#34D399', '#EF4444', '#D1D5DB'],
                    }
                ]
            };

            return (
                <div>
                    <h3>Resultados de los análisis con VADER:</h3>
                    <Doughnut data={data} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>
            );
        }

        return <div>Please select a text and an analysis type.</div>;
    };

    return (
        <>
            <textarea
                value={selectedText}
                readOnly
                rows={3}
                className="bg-gray-800 text-green-400 font-mono text-sm p-3 border-none rounded overflow-auto w-auto h-60"
            />
            {renderResults()}
        </>
    );
};
