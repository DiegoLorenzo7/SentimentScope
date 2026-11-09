import React, { useEffect, useState } from "react"
import { TextSelected } from "~features/text-selected"
import { getSettings } from "./settings"
import "./style.css"

type HistoryItem = {
  id: string
  createdAt: string
  mode?: "single" | "comparison"
  algorithm: string
  text: string
  senpyData?: any
  comparisonResults?: any[]
  source?: string
}

type TabType = "analysis" | "dashboard" | "history"

const getAlgorithmLabel = (algorithm: string) => {
  if (algorithm === "sentiment-vader") return "VADER"
  if (algorithm === "sentiment140") return "Sentiment140"
  if (algorithm === "comparison") return "Comparison"
  return algorithm
}

const formatDate = (isoDate: string) => {
  try {
    return new Date(isoDate).toLocaleString()
  } catch {
    return ""
  }
}

const buildStats = (history: HistoryItem[]) => {
  const stats = {
    total: history.length,
    vader: 0,
    sentiment140: 0,
    comparison: 0
  }

  history.forEach((item) => {
    if (item.algorithm === "sentiment-vader") stats.vader++
    else if (item.algorithm === "sentiment140") stats.sentiment140++
    else if (item.algorithm === "comparison") stats.comparison++
  })

  const mostUsed = Object.entries({
    VADER: stats.vader,
    Sentiment140: stats.sentiment140,
    Comparison: stats.comparison
  }).sort((a, b) => b[1] - a[1])[0]

  return {
    ...stats,
    mostUsedAlgorithm: mostUsed?.[0] || "None"
  }
}

const IndexPopup = () => {
  const [selectedText, setSelectedText] = useState("")
  const [senpyData, setSenpyData] = useState<any | null>(null)
  const [algorithm, setAlgorithm] = useState("")
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [hasData, setHasData] = useState(false)
  const [theme, setTheme] = useState<"dark" | "light">("dark")
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [activeTab, setActiveTab] = useState<TabType>("analysis")

  const applyResult = (result: any) => {
    if (!result) {
      setHasData(false)
      setAnalysisResult(null)
      return
    }

    setAnalysisResult(result)
    setSelectedText(result.text || "")

    if (result.mode === "comparison") {
      setSenpyData(null)
      setAlgorithm("comparison")
    } else {
      setSenpyData(result.senpyData?.entries?.[0] ?? null)
      setAlgorithm(result.algorithm || "")
    }

    setHasData(true)
  }

  const loadHistory = async () => {
    const { analysisHistory } = await chrome.storage.local.get("analysisHistory")
    setHistory(Array.isArray(analysisHistory) ? analysisHistory : [])
  }

  const clearHistory = async () => {
    await chrome.storage.local.set({ analysisHistory: [] })
    setHistory([])
  }

  const openHistoryItem = (item: HistoryItem) => {
    applyResult(item)
    setActiveTab("analysis")
  }

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()

    URL.revokeObjectURL(url)
  }

  const exportAsJson = () => {
    if (!hasData || !analysisResult) return

    const exportData = {
      exportedAt: new Date().toISOString(),
      ...analysisResult
    }

    downloadFile(
      `sentiment-analysis-${Date.now()}.json`,
      JSON.stringify(exportData, null, 2),
      "application/json"
    )
  }

  const exportAsTxt = () => {
    if (!hasData || !analysisResult) return

    const content = `
Sentiment Analysis Export
=========================

Date: ${new Date().toLocaleString()}
Mode: ${analysisResult.mode || "single"}
Algorithm: ${getAlgorithmLabel(algorithm)}

Selected text:
${selectedText}

Raw result:
${JSON.stringify(analysisResult, null, 2)}
`

    downloadFile(`sentiment-analysis-${Date.now()}.txt`, content.trim(), "text/plain")
  }

  useEffect(() => {
    getSettings().then((settings) => {
      setTheme(settings.theme)
    })

    chrome.runtime.sendMessage({ type: "request-latest-analysis" }, (response) => {
      applyResult(response)
    })

    loadHistory()

    const onChanged = (changes: any, area: string) => {
      if (area === "local" && changes.lastAnalysisResult?.newValue) {
        applyResult(changes.lastAnalysisResult.newValue)
      }

      if (area === "local" && changes.appSettings?.newValue) {
        setTheme(changes.appSettings.newValue.theme || "dark")
      }

      if (area === "local" && changes.analysisHistory?.newValue) {
        setHistory(changes.analysisHistory.newValue || [])
      }
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const containerClasses =
    theme === "dark"
      ? "px-5 py-5 bg-[#2f3e46] shadow-2xl text-white text-base w-[430px] max-h-[700px] overflow-hidden"
      : "px-5 py-5 bg-gray-100 shadow-2xl text-gray-900 text-base w-[430px] max-h-[700px] overflow-hidden"

  const settingsButtonClasses =
    theme === "dark"
      ? "ui-button text-sm px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20"
      : "ui-button text-sm px-3 py-1.5 rounded-lg bg-black/10 hover:bg-black/20"

  const cardClasses =
    theme === "dark"
      ? "ui-card-hover p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10"
      : "ui-card-hover p-3 rounded-xl bg-black/5 border border-black/10 hover:bg-black/10"

  const tabClasses = (tab: TabType) => {
    const active = activeTab === tab

    if (theme === "dark") {
      return active
        ? "px-3 py-2 rounded-lg bg-purple-500/20 text-purple-300 text-sm font-semibold"
        : "px-3 py-2 rounded-lg text-sm opacity-70 hover:bg-white/10 transition"
    }

    return active
      ? "px-3 py-2 rounded-lg bg-purple-500/20 text-purple-700 text-sm font-semibold"
      : "px-3 py-2 rounded-lg text-sm opacity-70 hover:bg-black/10 transition"
  }

  const stats = buildStats(history)

  return (
    <div className={containerClasses}>
      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <img
               src={chrome.runtime.getURL("icon.png")}
               alt="SentimentScope"
               className="w-8 h-8 rounded-lg"
           />

          <div>
            <div className="text-lg font-bold ui-gradient-title">
              SentimentScope
            </div>

            <div className="text-xs opacity-70">
              Real-time sentiment analysis
            </div>
          </div>
        </div>

        <button
          className={settingsButtonClasses}
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          ⚙
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        <button
          className={tabClasses("analysis")}
          onClick={() => setActiveTab("analysis")}
        >
          Analysis
        </button>

        <button
          className={tabClasses("dashboard")}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={tabClasses("history")}
          onClick={() => setActiveTab("history")}
        >
          History
        </button>
      </div>

      <div className="scroll-area max-h-[560px] overflow-y-auto overflow-x-hidden pr-1">
        {activeTab === "analysis" && (
          <>
            {!hasData ? (
              <div className="flex flex-col items-center text-center py-6 space-y-4 animate-fade-in-scale">
                <img
                    src={chrome.runtime.getURL("icon.png")}
                    alt="SentimentScope"
                    className="w-16 h-16 rounded-2xl"
                 />

                <div>
                  <div className="text-xl font-bold">No analysis yet</div>

                  <div className="opacity-70 mt-1">
                    Start analyzing sentiment directly from any webpage.
                  </div>
                </div>

                <div className={cardClasses + " w-full text-left"}>
                  <div className="font-semibold mb-2">Quick start</div>

                  <ol className="space-y-1 text-sm opacity-80 list-decimal list-inside">
                    <li>Select text on a webpage</li>
                    <li>Right click → Analyze Sentiment</li>
                    <li>Select an algorithm</li>
                  </ol>
                </div>
              </div>
            ) : (
              <>
                <TextSelected
                  selectedText={selectedText}
                  senpyData={senpyData}
                  algorithm={algorithm}
                  theme={theme}
                  analysisResult={analysisResult}
                />

                <div className="mt-4 flex gap-2">
                  <button
                    className={settingsButtonClasses}
                    onClick={exportAsJson}
                  >
                    Export JSON
                  </button>

                  <button
                    className={settingsButtonClasses}
                    onClick={exportAsTxt}
                  >
                    Export TXT
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "dashboard" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="text-lg font-semibold">
                Statistics dashboard
              </div>

              <div className="text-xs px-2 py-1 rounded-full bg-purple-500/20 text-purple-400">
                Live
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className={cardClasses}>
                <div className="text-xs opacity-70">Total analyses</div>
                <div className="text-3xl font-bold mt-1">
                  {stats.total}
                </div>
              </div>

              <div className={cardClasses}>
                <div className="text-xs opacity-70">Most used</div>
                <div className="text-lg font-bold">
                  {stats.mostUsedAlgorithm}
                </div>
              </div>

              <div className={cardClasses}>
                <div className="text-xs opacity-70">VADER</div>
                <div className="text-2xl font-bold text-green-500">
                  {stats.vader}
                </div>
              </div>

              <div className={cardClasses}>
                <div className="text-xs opacity-70">Sentiment140</div>
                <div className="text-2xl font-bold text-blue-500">
                  {stats.sentiment140}
                </div>
              </div>

              <div className={cardClasses}>
                <div className="text-xs opacity-70">Comparison mode</div>
                <div className="text-2xl font-bold text-purple-500">
                  {stats.comparison}
                </div>
              </div>

              <div className={cardClasses}>
                <div className="text-xs opacity-70">Last analysis</div>
                <div className="text-sm font-bold">
                  {history[0]
                    ? formatDate(history[0].createdAt)
                    : "No data"}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="text-lg font-semibold">
                Analysis history
              </div>

              {history.length > 0 && (
                <button
                  className={settingsButtonClasses}
                  onClick={clearHistory}
                >
                  Clear
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-sm opacity-70">
                No previous analyses stored.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <button
                    key={item.id}
                    className={`w-full text-left ${cardClasses}`}
                    onClick={() => openHistoryItem(item)}
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-semibold">
                        {getAlgorithmLabel(item.algorithm)}
                      </span>

                      <span className="text-xs opacity-70">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    <div className="text-sm opacity-80 mt-1 line-clamp-2">
                      {item.text.length > 120
                        ? `${item.text.slice(0, 120)}...`
                        : item.text}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
export default IndexPopup