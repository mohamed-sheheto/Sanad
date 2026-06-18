# سند — Sanad: AI-Powered Investment Assistant

<p>
  <img alt="License" src="https://img.shields.io/badge/license-MIT-blue.svg">
  <img alt="Node" src="https://img.shields.io/badge/node-%3E%3D18-brightgreen">
  <img alt="Python" src="https://img.shields.io/badge/python-3.9%E2%80%933.11-blue">
</p>

As rampant inflation erodes savings, investing has shifted from a luxury to an essential strategy for wealth preservation. However, beginners often feel overwhelmed by the complexity and volatility of markets like real estate, gold, and stocks.

Sanad bridges this gap by acting as an intelligent financial assistant powered by advanced Deep Learning. The platform transforms complex market data into simplified, actionable feasibility studies and reliable future forecasts, empowering individuals to make informed, data-driven investment decisions.

## Demo

🎥 Watch the [`Demo.mp4`](./Demo.mp4) for a 2-minute walkthrough of the platform.

## Features

- **LSTM Price Predictions** — Deep learning models forecast prices for Gold, Egyptian Stocks (7 tickers: CIB, TMGH, FWRY, SWDY, ISPH, ETEL, EGAL), and Egyptian Real Estate (8 cities, 6 property types).

- **Interactive Dashboard** — Portfolio snapshot with total value, ROI, risk level, and trend charts.

- **Asset Comparison** — Side-by-side comparison of Gold vs Stocks vs Real Estate with predicted ROI, confidence levels, and projection overlays.

- **User Authentication** — Email/password registration and Google OAuth via Passport.js.

- **Portfolio Tracking** — MongoDB-backed holdings management with profit/loss calculations.

- **Model Caching** — Trained models are cached to disk with 24-hour freshness checks and background retraining.

- **Graceful Degradation** — Mock data fallbacks when live market data (Yahoo Finance) is unavailable.

## Tech Stack

Frontend: Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts,

Backend: Node.js, Express 5, JWT, Passport.js (Google OAuth), bcryptjs, cors, axios,

ML Service: Python 3.9–3.11, FastAPI, Uvicorn, TensorFlow 2 (LSTM), scikit-learn, yfinance, Pandas,

> 📖 For detailed setup (environment variables, Google OAuth config, database seeding, troubleshooting), see the [`sanad-installation-guide.md`](./sanad-installation-guide.md).

## Project Structure

```
sanad/
├── front/          Next.js frontend
├── server/         Express REST API + MongoDB models
├── ml-service/     FastAPI + TensorFlow LSTM models
├── readme.md
├── sanad-installation-guide.md
└── Demo.mp4
```
