
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
    if (!text || !lexicon) return [];
    const words = text.split(/\s+/);
    return words.filter(word => lexicon.hasOwnProperty(word.toLowerCase()))
                .map(word => ({
                    word: word,
                    sentiment: lexicon[word.toLowerCase()]
                }));
};
