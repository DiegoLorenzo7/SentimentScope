chrome.runtime.onInstalled.addListener(() => {
    // Crea el menú principal
    chrome.contextMenus.create({
        title: "Analyze Emotions",
        contexts: ["selection"],
        id: "senpyMenu"
    });

    // Submenú para Sentiment140
    chrome.contextMenus.create({
        title: "Sentiment140",
        contexts: ["selection"],
        parentId: "senpyMenu",
        id: "sentiment140"
    });

    // Submenú para VADER (sin funcionalidad aún)
    chrome.contextMenus.create({
        title: "VADER",
        contexts: ["selection"],
        parentId: "senpyMenu",
        id: "vader"
    });

    // Submenú para Sentiment Basic (sin funcionalidad aún)
    chrome.contextMenus.create({
        title: "Sentiment Basic",
        contexts: ["selection"],
        parentId: "senpyMenu",
        id: "sentimentBasic"
    });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "sentiment140" && info.selectionText) {
        const endpoint = 'http://senpy.gsi.upm.es/api';
        const algorithm = 'sentiment140';  
        try {
            const response = await fetch(`${endpoint}?input=${encodeURIComponent(info.selectionText)}&algo=${algorithm}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            chrome.tabs.sendMessage(tab.id, {
                type: "senpy-result",
                text: info.selectionText,
                senpyData: data
            });
        } catch (error) {
            console.error('Error fetching data from Senpy:', error);
            chrome.tabs.sendMessage(tab.id, {
                type: "error",
                message: "Failed to fetch data from Senpy."
            });
        }
    }
    

});