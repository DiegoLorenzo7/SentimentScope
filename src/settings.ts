export type ThemeMode = "dark" | "light"
export type ChartType = "doughnut" | "bar" | "polarArea"
export type KeywordMode = "all" | "filtered" | "top"

export type AppSettings = {
  theme: ThemeMode
  chartType: ChartType
  comparisonMode: boolean
  keywordMode: KeywordMode
}

export const defaultSettings: AppSettings = {
  theme: "dark",
  chartType: "doughnut",
  comparisonMode: false,
  keywordMode: "top"
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const result = await chrome.storage.local.get("appSettings")
    return {
      ...defaultSettings,
      ...(result.appSettings || {})
    }
  } catch (error) {
    console.error("Failed to read app settings", error)
    return defaultSettings
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  try {
    await chrome.storage.local.set({ appSettings: settings })
  } catch (error) {
    console.error("Failed to save app settings", error)
  }
}