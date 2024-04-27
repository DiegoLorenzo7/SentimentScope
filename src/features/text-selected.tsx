import React, { useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import Chart, { Tooltip }  from 'chart.js/auto';
import 'chart.js/auto';
import { loadLexicon, analyzeKeywords } from './parsing_vader';
import ChartDataLabels from 'chartjs-plugin-datalabels';

Chart.register(ChartDataLabels);
const centerTextPlugin = {
    id: 'centerText',
    afterDraw: (chart) => {
      const ctx = chart.ctx;
      ctx.save();
      const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
      const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;
      ctx.font = 'bold 37px Roboto Mono';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'white';
  
      chart.data.datasets.forEach((dataset, i) => {
        const meta = chart.getDatasetMeta(i);
        if (!meta.hidden) {
            const total = dataset.data.reduce((a, b) => a + b, 0);
            const percentage = ((dataset.data[0] / total) * 100).toFixed(1);
            const label = chart.data.labels[i];

            // Cambiar el color del texto basado en la etiqueta
            if (label === 'Positive') {
                ctx.fillStyle = '#32CD32'; // Verde para 'Positive'
            } else if (label === 'Negative') {
                ctx.fillStyle = '#FF2D00'; // Rojo para 'Negative'
            }

            ctx.fillText(percentage + '%', centerX, centerY);
        }
    });

    ctx.restore();
  }
};
 

  Chart.register(centerTextPlugin);



  //Seleccion del tipo de analisis
export const TextSelected = ({ selectedText, senpyData, algorithm }) => {
    const [lexicon, setLexicon] = useState({});

    useEffect(() => {
        if (algorithm === "sentiment-vader") {  // Cargar léxico solo si el algoritmo es VADER
            loadLexicon().then(setLexicon);
        }
    }, [algorithm]);  // Agregar algorithm como dependencia del efecto

    const { coloredText, keywords } = analyzeKeywords(selectedText, lexicon);

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
            
 //Construcción del diagrama circular
            const options = {
                responsive: true,
                maintainAspectRatio: false,
                cutout:'80%',
                plugins: {
                    datalabels:{
                        display: false
                    },
                    tooltip: {
                    enabled: false
                },
                    centerText: true,  
                    legend: {
                        display: false
                    }
                }
            };
        
            const createData = (count, label, color) => ({
                labels: [label, 'Other'],
                datasets: [{
                    data: [count * 100, 100 - count * 100],
                    backgroundColor: [color, '#282828'],
                }]
            });

            //Mostrar los datosnque no son el cuadro de texto
            return (
                <div className="p-3  text-white font-mono text-sm rounded overflow-auto">
                    <h3 className="text-lg font-bold text-center">Resultados de los análisis con VADER:</h3>
                    <div className="flex flex-row justify-center items-center">
                        <div className="flex-none w-1/3 p-2">
                            
                            <Doughnut data={createData(polarityCounts['Positive'] || 0, 'Positive', '#32CD32')} options={options} />
                        </div>
                        <div className="flex-none w-1/3 p-2">
                            <Doughnut data={createData(polarityCounts['Negative'] || 0, 'Negative', '#FF2D00')} options={options} />
                        </div>
                        <div className="flex-none w-1/3 p-2">
                            <Doughnut data={createData(polarityCounts['Neutral'] || 0, 'Neutral', '#D1D5DB')} options={options} />
                        </div>
                    </div>
                    <div className="mt-4">
                        <h3 className="font-bold">Análisis de palabras clave:</h3>
                        {keywords.map((item, index) => (
                            <p key={index}>{item.word}: {item.sentiment > 0 ? 'Positive' : item.sentiment < 0 ? 'Negative' : 'Neutral'}</p>
                        ))}
                    </div>
                </div>
            );
            
            
            
        }

        return <div>Please select a text and an analysis type.</div>;
    };

    return (
        <>
            <div
                className="bg-black text-white font-mono text-sm p-3 border-none rounded overflow-auto w-auto h-60"
                dangerouslySetInnerHTML={{ __html: coloredText }}
            />
            {renderResults()}
        </>
    );
};
