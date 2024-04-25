chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        title: "Analyze Emotions",
        contexts: ["selection"],
        id: "senpyMenu"
    });

    chrome.contextMenus.create({
        title: "Sentiment140",
        contexts: ["selection"],
        parentId: "senpyMenu",
        id: "sentiment140"
    });

    chrome.contextMenus.create({
        title: "VADER",
        contexts: ["selection"],
        parentId: "senpyMenu",
        id: "sentiment-vader"
    });
});

let lastAnalysisResult = null;

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if ((info.menuItemId === "sentiment140" || info.menuItemId === "sentiment-vader") && info.selectionText) {
        const endpoint = 'http://senpy.gsi.upm.es/api';
        const algorithm = info.menuItemId;

        try {
            const response = await fetch(`${endpoint}?input=${encodeURIComponent(info.selectionText)}&algo=${algorithm}`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }

            const data = await response.json();
            lastAnalysisResult = {
                algorithm: info.menuItemId,
                text: info.selectionText,
                senpyData: data
            };

            chrome.tabs.sendMessage(tab.id, {
                type: "senpy-result",
                algorithm: info.menuItemId,
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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "request-latest-analysis") {
        sendResponse(lastAnalysisResult);
    }
});
