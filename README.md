# SentimentScope

**Interactive Sentiment Analysis Chrome Extension**

SentimentScope is a Chrome browser extension designed to analyze the sentiment of user-selected text directly from web pages. It integrates Natural Language Processing (NLP) services through Senpy and provides interactive visualizations to help users interpret sentiment analysis results.

The project was developed as a Bachelor's Thesis in Telecommunication Engineering at the **Universidad Politécnica de Madrid (UPM)**.

## Features

- **Context Menu Integration:** Select text on any supported web page and launch sentiment analysis directly from the browser's context menu.
- **Multiple Sentiment Analysis Algorithms:** Integration with Senpy-based NLP services, including VADER and Sentiment140, depending on backend availability.
- **Interactive Visualizations:** Display sentiment analysis results using configurable charts.
- **Keyword Heatmaps:** Highlight relevant words in the selected text according to their sentiment polarity.
- **Algorithm Comparison:** Compare results from different sentiment analysis algorithms.
- **Analysis History:** Store recent analysis results locally using Chrome Storage.
- **Customizable Settings:** Configure the appearance, chart type, and keyword visualization options.

## Technology Stack

| Technology | Purpose |
|---|---|
| React | User interface development |
| TypeScript | Application logic and type safety |
| Plasmo | Browser extension framework |
| Tailwind CSS | Interface styling |
| Chart.js | Interactive data visualization |
| Chrome Extension APIs | Context menus, storage, and browser communication |
| Senpy | Sentiment analysis service integration |
| Docker | Local deployment of the Senpy backend |

## System Architecture

SentimentScope follows a modular architecture consisting of three main components:

**1. Browser Extension**

The Chrome extension handles user interaction, text selection, background processing, local storage, and communication between extension components.

**2. Sentiment Analysis Backend**

Selected text is sent to a Senpy service for sentiment analysis. The backend processes the text using the selected algorithm and returns structured JSON results.

**3. Visualization Layer**

The visualization components interpret the analysis results and display them through interactive charts, sentiment indicators, and keyword highlighting.

The architecture separates user interaction, analysis processing, and visualization to facilitate maintenance and future extensions.

## How It Works

1. The user selects text on a web page.
2. The user opens the context menu and chooses a sentiment analysis algorithm.
3. The extension sends the selected text to the configured Senpy backend.
4. The backend processes the text and returns the analysis results.
5. The extension interprets the JSON response and prepares the data for visualization.
6. Results are displayed in the extension popup and through visual elements on the web page.

## Installation and Development

### Prerequisites

- Node.js
- pnpm
- Google Chrome or another compatible Chromium-based browser
- A running Senpy backend with the required sentiment analysis plugins

### Install Dependencies

```bash
pnpm install
```

### Start Development

```bash
pnpm dev
```

Load the development build as an unpacked extension from `chrome://extensions`, with Developer Mode enabled.

### Build for Production

```bash
pnpm build
```

### Package the Extension

```bash
pnpm package
```

### Backend Configuration

SentimentScope communicates with Senpy through HTTP requests. The backend must be running and accessible from the browser extension.

During development, Senpy was deployed locally using Docker. A local installation may require configuring the backend endpoint and enabling the appropriate sentiment analysis plugins.

**Note:** Installing the browser extension alone does not automatically deploy the Senpy backend.

## Screenshots

Screenshots of the following components will be added:

- Extension popup and sentiment analysis results
- Interactive sentiment charts
- Keyword highlighting and heatmap overlay
- Extension settings
- Algorithm comparison

## Academic Context

SentimentScope was developed as a Bachelor's Thesis at the Universidad Politécnica de Madrid, focusing on browser-based sentiment analysis, NLP service integration, and interactive data visualization.

The project builds upon an existing Plasmo browser-extension codebase and extends it with sentiment analysis functionality, a redesigned interface, and additional visualization and configuration features.

Original project: [TFG_Plasmo_Plugin](https://github.com/pablo2899/TFG_Plasmo_Plugin)

## Author

**Diego Lorenzo Roviralta**

Telecommunication Engineering — Universidad Politécnica de Madrid

GitHub: [DiegoLorenzo7](https://github.com/DiegoLorenzo7)

## Privacy

SentimentScope processes user-selected text through a sentiment analysis backend. Application preferences and analysis-related information may be stored locally using Chrome Storage.

For additional information, see the [Privacy Policy](https://diegolorenzo7.github.io/sentimentscope-privacy/).