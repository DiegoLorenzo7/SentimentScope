import React, { useEffect, useState } from "react"
import "./style.css"
import type { AppSettings } from "./settings"
import { defaultSettings, getSettings, saveSettings } from "./settings"

const OptionsPage = () => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    getSettings().then(setSettings)
  }, [])

  const updateSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings)
    await saveSettings(newSettings)

    setSaved(true)
    setTimeout(() => setSaved(false), 1200)
  }

  const resetSettings = async () => {
    await updateSettings(defaultSettings)
  }

  const isDark = settings.theme === "dark"

  const pageClasses = isDark
    ? "min-h-screen px-8 py-8 bg-gray-950 text-white"
    : "min-h-screen px-8 py-8 bg-gray-100 text-gray-900"

  const cardClasses = isDark
    ? "rounded-2xl shadow-2xl p-6 border border-white/10 bg-white/5"
    : "rounded-2xl shadow-2xl p-6 border border-black/10 bg-white"

  const optionCardClasses = isDark
    ? "ui-glow-hover rounded-xl p-4 border border-white/10 bg-white/5"
    : "ui-glow-hover rounded-xl p-4 border border-black/10 bg-black/5"

  const selectClasses = isDark
    ? "w-full p-2 rounded-lg bg-gray-900 border border-white/10 text-white"
    : "w-full p-2 rounded-lg bg-white border border-black/10 text-gray-900"

  const buttonClasses = isDark
    ? "px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition"
    : "px-4 py-2 rounded-lg bg-black/10 hover:bg-black/20 transition"

  return (
    <div className={pageClasses}>
      <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-scale">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold ui-gradient-title">
              Extension Settings
            </h1>

            <p className="opacity-70 mt-2">
              Customize the behaviour and visual appearance of the sentiment
              analysis extension.
            </p>
          </div>

          <div
            className={`text-sm px-3 py-1.5 rounded-full ${
              saved
                ? "bg-green-500/20 text-green-400"
                : isDark
                  ? "bg-white/10 text-white/70"
                  : "bg-black/10 text-gray-600"
            }`}
          >
            {saved ? "Saved" : "Auto-save"}
          </div>
        </div>

        <div className={cardClasses}>
          <div className="space-y-5">

            {/* Theme */}
            <div className={optionCardClasses}>
              <div className="flex justify-between gap-4 mb-3">
                <div>
                  <label className="block text-lg font-semibold">
                    Theme
                  </label>

                  <p className="text-sm opacity-70">
                    Choose the visual mode used by the popup and analysis overlay.
                  </p>
                </div>

                <div className="text-3xl">
                  {isDark ? "🌙" : "☀️"}
                </div>
              </div>

              <select
                className={selectClasses}
                value={settings.theme}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    theme: e.target.value as AppSettings["theme"]
                  })
                }
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Chart type */}
            <div className={optionCardClasses}>
              <div className="flex justify-between gap-4 mb-3">
                <div>
                  <label className="block text-lg font-semibold">
                    Chart type
                  </label>

                  <p className="text-sm opacity-70">
                    Select the chart used to represent sentiment distributions.
                  </p>
                </div>

                <div className="text-3xl">📊</div>
              </div>

              <select
                className={selectClasses}
                value={settings.chartType}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    chartType: e.target.value as AppSettings["chartType"]
                  })
                }
              >
                <option value="doughnut">Doughnut</option>
                <option value="bar">Bar</option>
                <option value="polarArea">Polar Area</option>
              </select>
            </div>

            {/* Keyword mode */}
            <div className={optionCardClasses}>
              <div className="flex justify-between gap-4 mb-3">
                <div>
                  <label className="block text-lg font-semibold">
                    Keyword Highlighting Mode
                  </label>

                  <p className="text-sm opacity-70">
                    Configure how detected sentiment keywords are displayed in
                    the heatmap.
                  </p>
                </div>

                <div className="text-3xl">🔥</div>
              </div>

              <select
                className={selectClasses}
                value={settings.keywordMode}
                onChange={(e) =>
                  updateSettings({
                    ...settings,
                    keywordMode: e.target.value as AppSettings["keywordMode"]
                  })
                }
              >
                <option value="all">All keywords</option>
                <option value="filtered">Filtered sentiment keywords</option>
                <option value="top">Top keywords</option>
              </select>

              <div className="mt-3 text-xs opacity-70">
                {settings.keywordMode === "all" &&
                  "Shows every keyword detected in the sentiment lexicon."}

                {settings.keywordMode === "filtered" &&
                  "Hides repeated or low relevance keywords."}

                {settings.keywordMode === "top" &&
                  "Shows only the strongest sentiment keywords."}
              </div>
            </div>

            {/* Comparison mode */}
            <div className={optionCardClasses}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-lg font-semibold">
                    Algorithm comparison
                  </div>

                  <p className="text-sm opacity-70">
                    Run VADER and Sentiment140 on the same selected text and
                    compare their outputs.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.comparisonMode}
                    onChange={(e) =>
                      updateSettings({
                        ...settings,
                        comparisonMode: e.target.checked
                      })
                    }
                  />

                  <div className="w-11 h-6 bg-gray-500 rounded-full peer peer-checked:bg-purple-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:h-5 after:w-5 after:rounded-full after:transition-all peer-checked:after:translate-x-5" />
                </label>
              </div>
            </div>

          </div>

          <div className="mt-6 flex justify-between items-center border-t border-current/20 pt-4">
            <div className="text-sm opacity-70">
              Changes are saved automatically.
            </div>

            <button
              className={buttonClasses}
              onClick={resetSettings}
            >
              Reset to defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OptionsPage