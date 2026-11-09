import React, { useEffect, useMemo, useState } from "react"
import { Bar, Doughnut, PolarArea } from "react-chartjs-2"
import Chart from "chart.js/auto"
import "chart.js/auto"
import ChartDataLabels from "chartjs-plugin-datalabels"

import { getSettings } from "../settings"
import { analyzeKeywords, loadLexicon } from "./parsing_vader"

Chart.register(ChartDataLabels)

const centerTextPlugin = {
  id: "centerText",
  afterDraw: (chart: any) => {
    const centerTextEnabled = chart.options?.plugins?.centerText !== false
    if (!centerTextEnabled) return

    const chartType = chart.config?.type
    if (chartType !== "doughnut") return

    const ctx = chart.ctx
    ctx.save()

    const centerX = (chart.chartArea.left + chart.chartArea.right) / 2
    const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2

    ctx.font = "bold 24px Roboto Mono"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    chart.data.datasets.forEach((dataset: any) => {
      const total = dataset.data.reduce((a: number, b: number) => a + b, 0)
      const percentage = total > 0 ? ((dataset.data[0] / total) * 100).toFixed(1) : "0.0"
      const label = chart.data.labels?.[0]

      if (label === "Positive") ctx.fillStyle = "#32CD32"
      else if (label === "Negative") ctx.fillStyle = "#FF2D00"
      else if (label === "Neutral") ctx.fillStyle = "#6B7280"
      else ctx.fillStyle = "#FFFFFF"

      ctx.fillText(`${percentage}%`, centerX, centerY)
    })

    ctx.restore()
  }
}

Chart.register(centerTextPlugin)

type ThemeMode = "dark" | "light"
type ChartType = "doughnut" | "bar" | "polarArea"
type KeywordMode = "all" | "filtered" | "top"

type KeywordItem = {
  word: string
  sentiment: number
  polarity?: "positive" | "negative" | "neutral"
}

type TextSelectedProps = {
  selectedText: string
  senpyData: any
  algorithm: string
  theme?: ThemeMode
  analysisResult?: any
}

const STOPWORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "from",
  "ha", "has", "he", "her", "his", "i", "in", "is", "it", "la", "las",
  "le", "lo", "los", "me", "mi", "mis", "no", "not", "of", "on", "or",
  "our", "que", "se", "she", "sin", "su", "sus", "the", "their", "this",
  "to", "un", "una", "was", "we", "with", "y"
])

const normalizePolarity = (rawPolarity: string = "") => {
  const label = rawPolarity.split(":").pop() || rawPolarity

  if (label.toLowerCase().includes("pos")) return "Positive"
  if (label.toLowerCase().includes("neg")) return "Negative"
  if (label.toLowerCase().includes("neu")) return "Neutral"

  return label
}

const getAlgorithmLabel = (algorithm: string) => {
  if (algorithm === "sentiment-vader") return "VADER"
  if (algorithm === "sentiment140") return "Sentiment140"
  if (algorithm === "comparison") return "Comparison"
  return algorithm
}

const getPolarityClasses = (polarity: string, theme: ThemeMode) => {
  if (polarity === "Positive") {
    return "bg-green-500/20 text-green-500 border border-green-400/40"
  }

  if (polarity === "Negative") {
    return "bg-red-500/20 text-red-500 border border-red-400/40"
  }

  return theme === "dark"
    ? "bg-gray-500/20 text-gray-200 border border-gray-400/30"
    : "bg-gray-500/20 text-gray-700 border border-gray-400/40"
}

const getChartOptions = (chartType: ChartType, theme: ThemeMode, doughnut = false) => {
  if (doughnut) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "80%",
      plugins: {
        datalabels: { display: false },
        tooltip: { enabled: false },
        centerText: true,
        legend: { display: false }
      }
    }
  }

  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      datalabels: { display: false },
      centerText: false,
      legend: {
        display: chartType === "polarArea",
        position: "bottom" as const,
        labels: {
          color: theme === "dark" ? "#FFFFFF" : "#111827"
        }
      }
    },
    scales:
      chartType === "bar"
        ? {
            x: {
              ticks: { color: theme === "dark" ? "#FFFFFF" : "#111827" },
              grid: {
                color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }
            },
            y: {
              ticks: { color: theme === "dark" ? "#FFFFFF" : "#111827" },
              grid: {
                color: theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
              }
            }
          }
        : undefined
  }
}

const getCountsFromEntry = (entry: any, algorithm: string) => {
  const opinions = entry?.["marl:hasOpinion"] || []

  const counts = opinions.reduce(
    (acc: Record<string, number>, opinion: any) => {
      const polarity = normalizePolarity(opinion?.["marl:hasPolarity"] || "")

      let value = 1
      if (algorithm === "sentiment-vader") {
        const rawValue = parseFloat(opinion?.["marl:polarityValue"] ?? "1")
        value = Number.isNaN(rawValue) ? 1 : rawValue
      }

      acc[polarity] = (acc[polarity] || 0) + value
      return acc
    },
    {}
  )

  return {
    positive: counts["Positive"] || 0,
    negative: counts["Negative"] || 0,
    neutral: counts["Neutral"] || 0,
    total: (counts["Positive"] || 0) + (counts["Negative"] || 0) + (counts["Neutral"] || 0)
  }
}

const getMainPolarity = (positive: number, negative: number, neutral: number) => {
  if (positive >= negative && positive >= neutral) return "Positive"
  if (negative >= positive && negative >= neutral) return "Negative"
  return "Neutral"
}

const processKeywords = (keywords: KeywordItem[], mode: KeywordMode) => {
  if (mode === "all") return keywords

  const unique = new Map<string, KeywordItem>()

  keywords.forEach((item) => {
    const key = item.word.toLowerCase()
    const isStopword = STOPWORDS.has(key)
    const isTooShort = key.length <= 2
    const isWeak = Math.abs(item.sentiment) < 1

    if (mode === "filtered" && (isStopword || isTooShort || isWeak)) return
    if (mode === "top" && (isStopword || isTooShort)) return

    const previous = unique.get(key)
    if (!previous || Math.abs(item.sentiment) > Math.abs(previous.sentiment)) {
      unique.set(key, item)
    }
  })

  const sorted = Array.from(unique.values()).sort(
    (a, b) => Math.abs(b.sentiment) - Math.abs(a.sentiment)
  )

  return mode === "top" ? sorted.slice(0, 10) : sorted
}

export const TextSelected = ({
  selectedText,
  senpyData,
  algorithm,
  theme = "dark",
  analysisResult
}: TextSelectedProps) => {
  const [lexicon, setLexicon] = useState<Record<string, number>>({})
  const [chartType, setChartType] = useState<ChartType>("doughnut")
  const [keywordMode, setKeywordMode] = useState<KeywordMode>("top")

  useEffect(() => {
    if (algorithm === "sentiment-vader" || algorithm === "comparison") {
      loadLexicon().then(setLexicon)
    }
  }, [algorithm])

  useEffect(() => {
    getSettings().then((settings) => {
      setChartType(settings.chartType)
      setKeywordMode(settings.keywordMode || "top")
    })

    const onChanged = (changes: any, area: string) => {
      if (area === "local" && changes.appSettings?.newValue) {
        setChartType(changes.appSettings.newValue.chartType || "doughnut")
        setKeywordMode(changes.appSettings.newValue.keywordMode || "top")
      }
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  const { coloredText, keywords } = useMemo(() => {
    if (algorithm === "sentiment-vader" || algorithm === "comparison") {
      return analyzeKeywords(selectedText, lexicon)
    }

    return {
      coloredText: selectedText,
      keywords: []
    }
  }, [selectedText, lexicon, algorithm])

  const displayedKeywords = useMemo(
    () => processKeywords(keywords, keywordMode),
    [keywords, keywordMode]
  )

  const textBlockClasses =
    theme === "dark"
      ? "bg-black text-white font-mono text-sm p-3 border-none rounded overflow-auto w-auto max-h-60 whitespace-pre-wrap"
      : "bg-white text-gray-900 font-mono text-sm p-3 border border-black/10 rounded overflow-auto w-auto max-h-60 whitespace-pre-wrap"

  const panelClasses =
    theme === "dark"
      ? "bg-white/5 rounded-lg p-4 border border-white/10"
      : "bg-black/5 rounded-lg p-4 border border-black/10 text-gray-900"

  const rootTextClasses = theme === "dark" ? "text-white" : "text-gray-900"

  const renderTextBlock = () => {
    if (algorithm === "sentiment-vader" || algorithm === "comparison") {
      return (
        <div
          className={textBlockClasses}
          dangerouslySetInnerHTML={{ __html: coloredText }}
        />
      )
    }

    return <div className={textBlockClasses}>{selectedText}</div>
  }

  const renderDistributionChart = (positive: number, negative: number, neutral: number) => {
    const total = positive + negative + neutral
    const safeTotal = total > 0 ? total : 1

    const doughnutOptions = getChartOptions(chartType, theme, true)
    const standardChartOptions = getChartOptions(chartType, theme, false)

    const createDoughnutData = (count: number, label: string, color: string) => ({
      labels: [label, "Other"],
      datasets: [
        {
          data: [count, Math.max(safeTotal - count, 0)],
          backgroundColor: [color, theme === "dark" ? "#000000" : "#E5E7EB"],
          borderWidth: 0
        }
      ]
    })

    const distributionData = {
      labels: ["Positive", "Negative", "Neutral"],
      datasets: [
        {
          label: "Sentiment distribution",
          data: [positive, negative, neutral],
          backgroundColor: ["#32CD32", "#FF2D00", "#9CA3AF"]
        }
      ]
    }

    if (chartType === "bar") {
      return (
        <div className="w-full h-72">
          <Bar data={distributionData} options={standardChartOptions} />
        </div>
      )
    }

    if (chartType === "polarArea") {
      return (
        <div className="w-full h-72">
          <PolarArea data={distributionData} options={standardChartOptions} />
        </div>
      )
    }

    return (
      <div className="flex flex-row justify-center items-center w-full">
        <div className="flex-none w-1/3 p-2 h-36">
          <Doughnut data={createDoughnutData(positive, "Positive", "#32CD32")} options={doughnutOptions} />
        </div>

        <div className="flex-none w-1/3 p-2 h-36">
          <Doughnut data={createDoughnutData(negative, "Negative", "#FF2D00")} options={doughnutOptions} />
        </div>

        <div className="flex-none w-1/3 p-2 h-36">
          <Doughnut data={createDoughnutData(neutral, "Neutral", "#9CA3AF")} options={doughnutOptions} />
        </div>
      </div>
    )
  }

  const renderKeywordList = () => {
    return (
      <div className={panelClasses}>
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="font-bold">Keyword Analysis</div>
          <span className="ui-chip ui-chip-purple">{keywordMode}</span>
        </div>

        <div className="flex flex-wrap gap-2 mb-3">
          <span className="ui-chip ui-chip-positive">Positive keyword</span>
          <span className="ui-chip ui-chip-negative">Negative keyword</span>
          <span className="ui-chip ui-chip-neutral">Neutral keyword</span>
        </div>

        {displayedKeywords.length > 0 ? (
          <div className="space-y-1">
            {displayedKeywords.map((item, index) => {
              const label =
                item.sentiment > 0
                  ? "Positive"
                  : item.sentiment < 0
                    ? "Negative"
                    : "Neutral"

              const score =
                item.sentiment > 0
                  ? `+${item.sentiment.toFixed(2)}`
                  : item.sentiment.toFixed(2)

              const scoreClass =
                item.sentiment > 0
                  ? "text-green-500"
                  : item.sentiment < 0
                    ? "text-red-500"
                    : "text-gray-500"

              return (
                <p key={`${item.word}-${index}`} className="flex justify-between gap-3">
                  <span>
                    {item.word}: {label}
                  </span>
                  <span className={`font-bold ${scoreClass}`}>{score}</span>
                </p>
              )
            })}
          </div>
        ) : (
          <div className="opacity-80">
            No relevant sentiment keywords were found with the current mode.
          </div>
        )}
      </div>
    )
  }

  const renderSentiment140 = () => {
    const opinions = senpyData?.["marl:hasOpinion"] || []

    if (!opinions.length) {
      return (
        <div className={`p-3 font-mono text-sm rounded overflow-auto ${rootTextClasses}`}>
          <div className="text-lg font-bold text-center mb-3">
            Sentiment140 Analysis Results
          </div>
          <div className="text-center opacity-80">
            No opinions are available in the response.
          </div>
        </div>
      )
    }

    const { positive, negative, neutral, total } = getCountsFromEntry(senpyData, "sentiment140")
    const mainPolarity = normalizePolarity(opinions[0]?.["marl:hasPolarity"] || "")

    return (
      <div className={`p-3 font-mono text-sm rounded overflow-auto space-y-4 ${rootTextClasses}`}>
        <div className="text-lg font-bold text-center">
          Sentiment140 Analysis Results
        </div>

        <div className="flex justify-center">
          <div className={`px-5 py-2.5 rounded-full shadow-lg backdrop-blur-sm text-base font-bold ${getPolarityClasses(mainPolarity, theme)}`}>
            {mainPolarity}
          </div>
        </div>

        <div className={panelClasses}>
          <div className="font-bold">Main Classification</div>
          <div className="opacity-90">
            The text has been classified as <strong>{mainPolarity}</strong>.
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className={panelClasses}>
            <div className="text-xs opacity-70">Positive</div>
            <div className="text-xl font-bold text-green-500">{positive}</div>
          </div>

          <div className={panelClasses}>
            <div className="text-xs opacity-70">Neutral</div>
            <div className="text-xl font-bold text-gray-500">{neutral}</div>
          </div>

          <div className={panelClasses}>
            <div className="text-xs opacity-70">Negative</div>
            <div className="text-xl font-bold text-red-500">{negative}</div>
          </div>
        </div>

        <div className="flex justify-center items-center">
          {renderDistributionChart(positive, negative, neutral)}
        </div>

        <div className={panelClasses}>
          <div className="font-bold mb-2">Technical Summary</div>
          <div className="opacity-90">Total number of detected opinions: {total}</div>
        </div>
      </div>
    )
  }

  const renderVader = () => {
    const opinions = senpyData?.["marl:hasOpinion"] || []

    if (!opinions.length) {
      return (
        <div className={`p-3 font-mono text-sm rounded overflow-auto ${rootTextClasses}`}>
          <div className="text-lg font-bold text-center mb-3">
            VADER Sentiment Results
          </div>
          <div className="text-center opacity-80">
            No opinions are available in the response.
          </div>
        </div>
      )
    }

    const { positive, negative, neutral } = getCountsFromEntry(senpyData, "sentiment-vader")

    return (
      <div className={`p-3 font-mono text-sm rounded overflow-auto space-y-4 ${rootTextClasses}`}>
        <div className="text-lg font-bold text-center">VADER Sentiment Results</div>

        <div className="flex justify-center items-center">
          {renderDistributionChart(positive, negative, neutral)}
        </div>

        {renderKeywordList()}
      </div>
    )
  }

  const renderComparison = () => {
    const results = analysisResult?.comparisonResults || []

    if (!results.length) {
      return (
        <div className={`${rootTextClasses} p-3`}>
          No comparison results are available.
        </div>
      )
    }

    return (
      <div className={`p-3 font-mono text-sm rounded overflow-auto space-y-4 ${rootTextClasses}`}>
        <div className="text-lg font-bold text-center">Algorithm Comparison</div>

        <div className={panelClasses}>
          <div className="font-bold mb-2">Analysed Text</div>
          <div className="opacity-90">
            The comparison mode runs VADER and Sentiment140 on the same selected text.
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="ui-chip ui-chip-positive">Positive keyword</span>
            <span className="ui-chip ui-chip-negative">Negative keyword</span>
            <span className="ui-chip ui-chip-neutral">Neutral keyword</span>
            <span className="ui-chip ui-chip-purple">{keywordMode}</span>
          </div>
        </div>

        {results.map((result: any) => {
          if (result.error) {
            return (
              <div key={result.algorithm} className={panelClasses}>
                <div className="font-bold text-red-500">
                  {getAlgorithmLabel(result.algorithm)}
                </div>
                <div className="opacity-90 mt-2">{result.error}</div>
              </div>
            )
          }

          const entry = result.senpyData?.entries?.[0]
          const { positive, negative, neutral, total } = getCountsFromEntry(entry, result.algorithm)
          const mainPolarity = getMainPolarity(positive, negative, neutral)

          return (
            <div key={result.algorithm} className="space-y-3">
              <div className="flex justify-center">
                <div className={`px-5 py-2.5 rounded-full shadow-lg backdrop-blur-sm text-base font-bold ${getPolarityClasses(mainPolarity, theme)}`}>
                  {getAlgorithmLabel(result.algorithm)}: {mainPolarity}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className={panelClasses}>
                  <div className="text-xs opacity-70">Positive</div>
                  <div className="text-xl font-bold text-green-500">{positive.toFixed(2)}</div>
                </div>

                <div className={panelClasses}>
                  <div className="text-xs opacity-70">Neutral</div>
                  <div className="text-xl font-bold text-gray-500">{neutral.toFixed(2)}</div>
                </div>

                <div className={panelClasses}>
                  <div className="text-xs opacity-70">Negative</div>
                  <div className="text-xl font-bold text-red-500">{negative.toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-center items-center">
                {renderDistributionChart(positive, negative, neutral)}
              </div>

              <div className={panelClasses}>
                <div className="font-bold mb-2">Technical Summary</div>
                <div className="opacity-90">
                  Algorithm: {getAlgorithmLabel(result.algorithm)}
                </div>
                <div className="opacity-90">
                  Total aggregated value: {total.toFixed(2)}
                </div>
              </div>
            </div>
          )
        })}

        {renderKeywordList()}
      </div>
    )
  }

  const renderResults = () => {
    if (algorithm === "comparison") {
      return renderComparison()
    }

    if (!senpyData || !algorithm) {
      return <div className={rootTextClasses}>No analysis data available.</div>
    }

    if (algorithm === "sentiment140") {
      return renderSentiment140()
    }

    if (algorithm === "sentiment-vader") {
      return renderVader()
    }

    return <div className={rootTextClasses}>Please select a text and an analysis type.</div>
  }

  return (
    <>
      {renderTextBlock()}
      {renderResults()}
    </>
  )
}