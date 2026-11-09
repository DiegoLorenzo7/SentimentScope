type VaderLexicon = Record<string, number>

type KeywordAnalysis = {
  word: string
  sentiment: number
  polarity: "positive" | "negative" | "neutral"
}

const escapeHtml = (value: string) => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

const getPolarity = (score: number): "positive" | "negative" | "neutral" => {
  if (score > 0) return "positive"
  if (score < 0) return "negative"
  return "neutral"
}

const getHeatmapStyle = (score: number) => {
  const absScore = Math.min(Math.abs(score), 4)
  const intensity = absScore / 4

  if (score > 0) {
    const alpha = 0.25 + intensity * 0.75
    return `
      background-color: rgba(34, 197, 94, ${alpha});
      color: #ffffff;
      border: 1px solid rgba(134, 239, 172, 0.95);
      box-shadow: 0 0 ${2 + intensity * 8}px rgba(34, 197, 94, ${0.25 + intensity * 0.45});
    `
  }

  if (score < 0) {
    const alpha = 0.25 + intensity * 0.75
    return `
      background-color: rgba(239, 68, 68, ${alpha});
      color: #ffffff;
      border: 1px solid rgba(252, 165, 165, 0.95);
      box-shadow: 0 0 ${2 + intensity * 8}px rgba(239, 68, 68, ${0.25 + intensity * 0.45});
    `
  }

  return `
    background-color: rgba(156, 163, 175, 0.45);
    color: #ffffff;
    border: 1px solid rgba(209, 213, 219, 0.8);
  `
}

export const loadLexicon = async (): Promise<VaderLexicon> => {
  try {
    const url = chrome.runtime.getURL("src/features/vader_lexicon.txt")
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error("Failed to load the vader_lexicon.txt file")
    }

    const text = await response.text()
    const lines = text.split("\n")
    const lexicon: VaderLexicon = {}

    lines.forEach((line) => {
      const parts = line.split("\t")

      if (parts.length > 1) {
        const word = parts[0].trim().toLowerCase()
        const score = parseFloat(parts[1])

        if (word && !Number.isNaN(score)) {
          lexicon[word] = score
        }
      }
    })

    return lexicon
  } catch (error) {
    console.error("Error loading the lexicon:", error)
    return {}
  }
}

export const analyzeKeywords = (text: string, lexicon: VaderLexicon) => {
  if (!text || !lexicon) {
    return {
      coloredText: escapeHtml(text || ""),
      keywords: [] as KeywordAnalysis[]
    }
  }

  const keywords: KeywordAnalysis[] = []

  const coloredText = escapeHtml(text).replace(/\b[\w'-]+\b/g, (matched) => {
    const lowerMatch = matched.toLowerCase()

    if (Object.prototype.hasOwnProperty.call(lexicon, lowerMatch)) {
      const sentiment = lexicon[lowerMatch]
      const polarity = getPolarity(sentiment)

      keywords.push({
        word: matched,
        sentiment,
        polarity
      })

      const style = getHeatmapStyle(sentiment)

      const score =
  sentiment > 0
    ? `+${sentiment.toFixed(2)}`
    : sentiment.toFixed(2)

const title = `${matched}: ${polarity} sentiment (${score})`

return `<span
  title="${escapeHtml(title)}"
  style="
    ${style}
    padding: 2px 6px;
    margin: 0 1px;
    border-radius: 8px;
    font-weight: 700;
    cursor: help;
    transition: all 160ms ease;
  "
>${matched}</span>`
    }

    return matched
  })

  return { coloredText, keywords }
}