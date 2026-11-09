const SENPY_ENDPOINT = "http://localhost:5000/api/"
const SUPPORTED_ALGORITHMS = ["sentiment-vader", "sentiment140"]

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    title: "Analyze Sentiment",
    contexts: ["selection"],
    id: "senpyMenu"
  })

  chrome.contextMenus.create({
    title: "Sentiment140",
    contexts: ["selection"],
    parentId: "senpyMenu",
    id: "sentiment140"
  })

  chrome.contextMenus.create({
    title: "VADER",
    contexts: ["selection"],
    parentId: "senpyMenu",
    id: "sentiment-vader"
  })

  chrome.contextMenus.create({
    title: "Settings",
    contexts: ["selection"],
    parentId: "senpyMenu",
    id: "open-settings"
  })
})

let lastAnalysisResult: any = null

async function readSettings() {
  const { appSettings } = await chrome.storage.local.get("appSettings")
  return {
    comparisonMode: false,
    ...(appSettings || {})
  }
}

async function persistLastAnalysis(result: any) {
  try {
    await chrome.storage.local.set({ lastAnalysisResult: result })
  } catch (e) {
    console.error("Failed to persist lastAnalysisResult", e)
  }
}

async function persistAnalysisHistory(result: any) {
  try {
    const { analysisHistory } = await chrome.storage.local.get("analysisHistory")

    const newEntry = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...result
    }

    const history = Array.isArray(analysisHistory) ? analysisHistory : []
    const updatedHistory = [newEntry, ...history].slice(0, 20)

    await chrome.storage.local.set({ analysisHistory: updatedHistory })
  } catch (e) {
    console.error("Failed to persist analysis history", e)
  }
}

async function readLastAnalysis() {
  try {
    const { lastAnalysisResult } = await chrome.storage.local.get("lastAnalysisResult")
    return lastAnalysisResult ?? null
  } catch (e) {
    console.error("Failed to read lastAnalysisResult", e)
    return null
  }
}

function safeSendToTab(tabId: number, payload: any) {
  chrome.tabs.sendMessage(tabId, payload, () => {
    if (chrome.runtime.lastError) {
      console.warn("No content receiver in this tab:", chrome.runtime.lastError.message)
    }
  })
}

async function fetchWithTimeout(url: string, timeoutMs = 7000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal
    })
  } finally {
    clearTimeout(timer)
  }
}

async function fetchSenpyAnalysis(text: string, algorithm: string) {
  const url = `${SENPY_ENDPOINT}?input=${encodeURIComponent(text)}&algo=${encodeURIComponent(
    algorithm
  )}&language=es`

  const timeoutMs = algorithm === "sentiment140" ? 20000 : 7000

  console.log("[senpy] url:", url)

  const response = await fetchWithTimeout(url, timeoutMs)

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`)
  }

  return await response.json()
}

async function runSingleAnalysis(text: string, algorithm: string) {
  const data = await fetchSenpyAnalysis(text, algorithm)

  return {
    mode: "single",
    algorithm,
    text,
    senpyData: data,
    source: "local-docker"
  }
}

async function runComparisonAnalysis(text: string) {
  const results = await Promise.allSettled(
    SUPPORTED_ALGORITHMS.map(async (algorithm) => {
      const data = await fetchSenpyAnalysis(text, algorithm)

      return {
        algorithm,
        senpyData: data
      }
    })
  )

  const comparisonResults = results.map((result, index) => {
    const algorithm = SUPPORTED_ALGORITHMS[index]

    if (result.status === "fulfilled") {
      return result.value
    }

    return {
      algorithm,
      error:
        algorithm === "sentiment140"
          ? "Sentiment140 did not respond correctly. The external service may be slow or unavailable."
          : "The algorithm did not respond correctly."
    }
  })

  return {
    mode: "comparison",
    algorithm: "comparison",
    text,
    comparisonResults,
    source: "local-docker"
  }
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "open-settings") {
    chrome.runtime.openOptionsPage()
    return
  }

  const isSupportedAlgo =
    info.menuItemId === "sentiment140" || info.menuItemId === "sentiment-vader"

  if (!isSupportedAlgo || !info.selectionText) return

  const selectedText = info.selectionText
  const clickedAlgorithm = String(info.menuItemId)
  const settings = await readSettings()
  const shouldCompare = Boolean(settings.comparisonMode)

  const effectiveAlgorithm = shouldCompare ? "comparison" : clickedAlgorithm

  console.log("[senpy] clicked", {
    algorithm: effectiveAlgorithm,
    textPreview: selectedText.slice(0, 80)
  })

  if (tab?.id) {
    safeSendToTab(tab.id, {
      type: "loading",
      algorithm: effectiveAlgorithm,
      text: selectedText
    })
  }

  try {
    const result = shouldCompare
      ? await runComparisonAnalysis(selectedText)
      : await runSingleAnalysis(selectedText, clickedAlgorithm)

    lastAnalysisResult = result

    await persistLastAnalysis(lastAnalysisResult)
    await persistAnalysisHistory(lastAnalysisResult)

    if (tab?.id) {
      safeSendToTab(tab.id, {
        type: "senpy-result",
        ...result
      })
    }
  } catch (error: any) {
    console.error("Error fetching data from Senpy:", error)

    let message = "Failed to fetch data from Senpy."

    if (error?.name === "AbortError") {
      message =
        clickedAlgorithm === "sentiment140"
          ? "Sentiment140 took too long to respond. The service may be slow or temporarily unavailable."
          : "The request to Senpy timed out. Make sure Docker/Senpy is running on localhost:5000."
    } else {
      message =
        "Could not contact Senpy on localhost:5000. Make sure Docker/Senpy is running."
    }

    if (tab?.id) {
      safeSendToTab(tab.id, {
        type: "error",
        message
      })
    }
  }
})

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  ;(async () => {
    if (message.type === "request-latest-analysis") {
      if (lastAnalysisResult) return sendResponse(lastAnalysisResult)

      const stored = await readLastAnalysis()
      return sendResponse(stored)
    }

    if (message.type === "open-settings") {
      chrome.runtime.openOptionsPage()
      return sendResponse({ ok: true })
    }
  })()

  return true
})