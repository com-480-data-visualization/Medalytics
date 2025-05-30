# 🏅 Medalytics

[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![D3.js](https://img.shields.io/badge/D3.js-7.9.0-orange.svg)](https://d3js.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Medalytics** brings Olympic stories to life through powerful data visualizations that showcase the heroes and history-makers of the Games. Witness the evolution of athletic excellence across generations through interactive charts and immersive visual experiences.

## 🌟 Features

- **🗺️ Interactive World Map**: Explore Olympic medal distributions across countries with D3.js-powered visualizations
- **📊 Dynamic Charts**: Multiple chart types including:
  - Gender evolution in Olympics over time
  - Medal race animations showing historical progressions
  - Olympic sports participation treemaps
  - Podium visualizations with top athletes
- **🎨 Modern UI/UX**: 
  - Smooth scroll-snap navigation
  - Dark/light theme toggle
  - Responsive design for all devices
  - Animated backgrounds and transitions
- **📱 Progressive Web App**: Optimized for both desktop and mobile experiences
- **⚡ Performance Optimized**: Fast loading with efficient data processing

## 🚀 Live Demo

Visit the live application: [Medalytics](https://medalytics.ch)

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** - Modern UI library with hooks
- **D3.js 7.9.0** - Powerful data visualization library
- **Recharts 2.5.0** - React charting library
- **CSS3** - Custom styling with CSS variables for theming

### Data Processing
- **Papa Parse 5.5.2** - CSV data parsing
- **TopoJSON Client 3.1.0** - Geographic data handling

### Development & Deployment
- **Create React App** - Project bootstrapping and build tools
- **Netlify** - Hosting and continuous deployment
- **ESLint** - Code linting and quality assurance

## 📊 Data Sources

The application uses several CSV datasets containing:
- Olympic athlete biographical information
- Medal records and country rankings
- Sport participation statistics
- Gender distribution over time
- Country-specific Olympic data

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/medalytics4.git
   cd medalytics4
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000) to view the app.

### Build for Production

```bash
npm run build
```

This builds the app for production to the `build` folder, optimizing the build for the best performance.

## 📁 Project Structure

```
medalytics4/
├── public/                 # Static assets and data files
│   ├── *.csv              # Olympic datasets
│   ├── *.svg              # Icon assets
│   └── index.html         # HTML template
├── src/
│   ├── components/        # React components
│   │   ├── D3WorldMap.jsx
│   │   ├── GenderEvolutionChart.jsx
│   │   ├── MedalRaceChart.jsx
│   │   ├── OlympicPodium.jsx
│   │   ├── OlympicSportsTreemap.jsx
│   │   └── ...
│   ├── utils/            # Utility functions
│   ├── App.js            # Main app component
│   ├── styles.css        # Global styles
│   └── index.js          # Entry point
├── netlify.toml          # Netlify deployment config
└── package.json          # Dependencies and scripts
```

## 🎯 Component Overview

### Core Visualizations
- **`D3WorldMap`** - Interactive world map showing medal distributions
- **`MedalRaceChart`** - Animated race chart of country medal counts over time
- **`OlympicPodium`** - Top athletes visualization with medal counts
- **`GenderEvolutionChart`** - Gender participation trends over Olympic history
- **`OlympicSportsTreemap`** - Sport participation represented as interactive treemap

### UI Components
- **`LogoIntro`** - Animated introduction with Olympic branding
- **`ExplanationPage`** - Project description with interactive elements
- **`ThemeToggle`** - Dark/light mode switcher
- **`PageIndicator`** - Navigation dots for scroll sections
- **`AnimatedBackground`** - Dynamic background effects

## 🔧 Configuration

### Environment Setup
No additional environment variables required for basic setup.

### Deployment
The app is configured for Netlify deployment with the following build command:
```bash
npm install papaparse d3 topojson-client --save && CI=false npm run build
```

## 📄 License

This project is licensed under the MIT License.
---

<div align="center">
  <strong>🏅 Celebrating Olympic Excellence Through Data 🏅</strong>
</div>
