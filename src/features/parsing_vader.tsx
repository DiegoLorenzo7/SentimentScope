
export const loadLexicon = async () => {
    try{
    const url = chrome.runtime.getURL('src/features/vader_lexicon.txt');
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to load the vader_lexicon.txt file');
    }
    const text = await response.text();
    const lines = text.split('\n');
    const lexicon = {};
    lines.forEach(line => {
        const parts = line.split('\t');
        if (parts.length > 1) {
            const word = parts[0];
            const score = parseFloat(parts[1]);
            lexicon[word] = score;
        }
    });
    return lexicon;
} catch (error) {
    console.error("Error loading the lexicon:", error);
    return {};
}
};


export const analyzeKeywords = (text, lexicon) => {
    if (!text || !lexicon) return { coloredText: text, keywords: [] };
    let coloredText = text;
    const keywords = [];
    const wordRegex = /\w+/g; // Captura palabras

    coloredText = text.replace(wordRegex, (matched) => {
        const lowerMatch = matched.toLowerCase();
        if (lexicon.hasOwnProperty(lowerMatch)) {
            const sentiment = lexicon[lowerMatch];
            const color = sentiment > 0 ? 'green' : sentiment < 0 ? 'red' : 'white'; // Asigna colores
            keywords.push({ word: matched, sentiment });
            return `<span style="color: ${color};">${matched}</span>`;
        }
        return matched;
    });

    return { coloredText, keywords };
};
