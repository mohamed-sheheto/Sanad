# Sanad — Agent Guide

## Repo Structure
- **`server/`** — Express.js API (port 8000), MongoDB/Mongoose, nodemon
- **`front/`** — Next.js 16 App Router (port 3000), pnpm, shadcn/ui, Tailwind
- **`ml-service/`** — FastAPI ML (port 8001), Python, TensorFlow, yfinance

## Startup Order
1. `ml-service/` — `python app.py` (or `uvicorn app:app --reload --port 8001`)
2. `server/` — `npm start` (nodemon, expects MongoDB at `DATABASE` in `.env`)
3. `front/` — `pnpm dev` (first `pnpm install`, then `pnpm dev`)

## Key Commands
| Where | Command | What |
|-------|---------|------|
| `server/` | `npm start` | Start Express with nodemon |
| `front/` | `pnpm dev` | Next.js dev with `--turbo` |
| `front/` | `pnpm build` | Production build |
| `front/` | `pnpm lint` | `next lint` only |
| `ml-service/` | `python app.py` | Start FastAPI on :8001 |

## Architecture Notes
- Front calls Express at `localhost:8000`; Express proxies ML predictions to FastAPI at `localhost:8001`.
- `front/next.config.mjs` has `typescript.ignoreBuildErrors: true` — TS errors don't block builds.
- `front/middleware.ts` exists but is **empty** — auth is client-side via `AuthContext` + localStorage JWT.
- `front/components.json` — shadcn/ui config. Use `@/components/ui/` for UI primitives, `@/lib/utils` for `cn()`.
- `server/controllers/trendController.js` returns **hardcoded data** (not from DB).
- Google OAuth redirects to `http://localhost:3000/dashboard?token=<jwt>`.
- ML models train lazily on first predict request (takes minutes). Not persisted between restarts.
- **Real estate** uses `RealEstateDataLoader` (CSV from Bayut) → generates synthetic time-series → trains LSTM. Single model for all cities (Cairo default). Predicts ROI %, not next price.
- Real estate frontend calls ML service **directly** on :8001 (no Express proxy), same pattern as stocks.
- `ml-service/models/real_estate_data_bayut_full.csv` — 50K rows of Egyptian property listings from Bayut. Used to compute baseline price-per-sqm per city + property type.
- `ml-service/seed_real_estate.py` — one-off training script to pre-seed model weights (run in TF-capable env).

## Conventions & Gotchas
- **No tests** exist in this repo.
- **No CI/CD** config present.
- Server uses **npm** (`package-lock.json`); Front uses **pnpm** (`pnpm-lock.yaml`). Do not mix.
- `server/.env` contains live credentials — **do not commit** (already in `.gitignore`).
- ML service needs Python venv with `requirements.txt` (TensorFlow 2.13–2.16, sklearn, yfinance).
- Dark theme (`#0a0a0a` bg, amber `#F59E0B` accent) throughout.
