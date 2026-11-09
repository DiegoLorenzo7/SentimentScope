import React, { useEffect, useMemo, useRef, useState } from "react"
import cssText from "data-text:~style.css"
import { TextSelected } from "~features/text-selected"
import { getSettings } from "./settings"

export const getStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

type OverlayPos = { x: number; y: number }

const PlasmoOverlay: React.FC = () => {
  const [selectedText, setSelectedText] = useState("")
  const [senpyData, setSenpyData] = useState<any | null>(null)
  const [algorithm, setAlgorithm] = useState("")
  const [analysisResult, setAnalysisResult] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [theme, setTheme] = useState<"dark" | "light">("dark")

  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const [pos, setPos] = useState<OverlayPos>({ x: 32, y: 120 })
  const draggingRef = useRef(false)
  const dragOffsetRef = useRef<OverlayPos>({ x: 0, y: 0 })

  const title = useMemo(() => {
    if (!algorithm) return "Analysis Results"
    if (algorithm === "comparison") return "Algorithm Comparison"
    const algo = algorithm === "sentiment-vader" ? "VADER" : algorithm
    return `${algo} Sentiment Analysis`
  }, [algorithm])

  useEffect(() => {
    getSettings().then((settings) => {
      setTheme(settings.theme)
    })

    const onChanged = (changes: any, area: string) => {
      if (area === "local" && changes.appSettings?.newValue) {
        setTheme(changes.appSettings.newValue.theme || "dark")
      }
    }

    chrome.storage.onChanged.addListener(onChanged)
    return () => chrome.storage.onChanged.removeListener(onChanged)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return

      const nextX = e.clientX - dragOffsetRef.current.x
      const nextY = e.clientY - dragOffsetRef.current.y

      const maxX = Math.max(8, window.innerWidth - 460)
      const maxY = Math.max(8, window.innerHeight - 120)

      setPos({
        x: Math.min(Math.max(8, nextX), maxX),
        y: Math.min(Math.max(8, nextY), maxY)
      })
    }

    const onMouseUp = () => {
      draggingRef.current = false
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [])

  useEffect(() => {
    const listener = (message: any) => {
      if (message.type === "loading") {
        setIsOpen(true)
        setIsLoading(true)
        setError(null)
        setAnalysisResult(null)
        setAlgorithm(message.algorithm || "")
        setSelectedText(message.text || "")
        setSenpyData(null)
        return
      }

      if (message.type === "senpy-result") {
        setIsOpen(true)
        setIsLoading(false)
        setError(null)
        setSelectedText(message.text || "")
        setAnalysisResult(message)

        if (message.mode === "comparison") {
          setSenpyData(null)
          setAlgorithm("comparison")
        } else {
          setSenpyData(message.senpyData?.entries?.[0] ?? null)
          setAlgorithm(message.algorithm || "")
        }

        return
      }

      if (message.type === "local-vader-request") {
        setIsOpen(true)
        setIsLoading(false)
        setError(null)
        setAnalysisResult(null)
        setSelectedText(message.text || "")
        setSenpyData(null)
        setAlgorithm("sentiment-vader")
        return
      }

      if (message.type === "error") {
        setIsOpen(true)
        setIsLoading(false)
        setError(message.message || "Error desconocido")
        return
      }
    }

    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  const startDrag = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    draggingRef.current = true
    dragOffsetRef.current = { x: e.clientX - pos.x, y: e.clientY - pos.y }
  }

  if (!isOpen) return null

  const containerClasses =
    theme === "dark"
      ? "z-[2147483647] fixed w-[95vw] max-w-[440px] ui-glass-dark text-blue-50 rounded-2xl shadow-2xl border border-white/10 animate-fade-in-scale overflow-hidden"
      : "z-[2147483647] fixed w-[95vw] max-w-[440px] ui-glass-light text-gray-900 rounded-2xl shadow-2xl border border-black/10 animate-fade-in-scale overflow-hidden"

  const headerClasses =
    theme === "dark"
      ? "flex items-center justify-between px-4 py-3 cursor-move select-none border-b border-white/10 bg-white/5"
      : "flex items-center justify-between px-4 py-3 cursor-move select-none border-b border-black/10 bg-black/5"

  const actionButtonClasses =
    theme === "dark"
      ? "ui-button rounded-lg px-2 py-1 hover:bg-white/10 transition"
      : "ui-button rounded-lg px-2 py-1 hover:bg-black/10 transition"

  return (
    <div className={containerClasses} style={{ left: pos.x, top: pos.y }}>
      <div
        className={headerClasses}
        onMouseDown={startDrag}
        title="Arrastra para mover"
      >
        <div className="flex items-center gap-2">
          <img
  src={chrome.runtime.getURL("icon.png")}
  alt="SentimentScope"
  className="w-8 h-8 rounded-lg"
/>
          <div>
            <div className="text-sm font-bold ui-gradient-title">
              SentimentScope
            </div>
            <div className="text-xs opacity-70">{title}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className={actionButtonClasses}
            onClick={() => chrome.runtime.sendMessage({ type: "open-settings" })}
            title="Settings"
          >
            ⚙
          </button>

          <button
            className={actionButtonClasses}
            onClick={() => setIsOpen(false)}
            title="Cerrar"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="scroll-area p-4 space-y-4 max-h-[75vh] overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-base font-semibold">
              <div
                className={`w-3 h-3 rounded-full animate-soft-pulse ${
                  theme === "dark" ? "bg-blue-400" : "bg-blue-500"
                }`}
              />
              Analyzing sentiment...
            </div>

            <div className="text-sm opacity-80">
              Running NLP analysis and collecting results...
            </div>

            <div
              className={`h-2 w-full rounded overflow-hidden ${
                theme === "dark" ? "bg-white/10" : "bg-black/10"
              }`}
            >
              <div
                className={`h-2 w-1/2 rounded animate-soft-pulse ${
                  theme === "dark" ? "bg-blue-400" : "bg-blue-500"
                }`}
              />
            </div>
          </div>
        ) : error ? (
          <div className="text-red-300 text-sm">
            <strong>Analysis failed:</strong> {error}
          </div>
        ) : (
          <TextSelected
            selectedText={selectedText}
            senpyData={senpyData}
            algorithm={algorithm}
            theme={theme}
            analysisResult={analysisResult}
          />
        )}
      </div>
    </div>
  )
}

export default PlasmoOverlay