## Prerequisites

| Software                                 | Version    |
| ---------------------------------------- | ---------- |
| **Git**                                  | Latest     |
| **Node.js**                              | ≥ 18       |
| **pnpm**                                 | Latest     |
| **Python**                               | 3.9 – 3.11 |
| **MongoDB Atlas**                        | Any        |
| **Microsoft Visual C++ Redistributable** | Latest     |

## Step 1 — Backend Setup (server/)

```powershell
cd server
npm install
```

**Environment variables** — The `.env.example` file is already included in the repository with pre-configured credentials for development.

Start the backend server:

```powershell
npm start
```

The server runs on **http://localhost:8000**.

## Step 2 — ML Service Setup (ml-service/)

```powershell
cd ml-service
pip install -r requirements.txt
```

**Environment variables** — The `.env.example` file is already included.
Start the ML service:

```powershell
python app.py
```

The ML service runs on **http://localhost:8001**.

## Step 3 — Frontend Setup (front/)

```powershell
cd front
pnpm install
pnpm run dev
```

The frontend runs on **http://localhost:3000**.

## Running All Services

You need **three terminal windows** open simultaneously:

| Terminal | Directory | Command | URL |
| 1 — ML Service | `ml-service` | `venv\Scripts\activate && python app.py` | http://localhost:8001 |
| 2 — Backend | `server` | `npm start` | http://localhost:8000 |
| 3 — Frontend | `front` | `pnpm run dev` | http://localhost:3000 |

**Startup order:** ML Service → Backend → Frontend (backend depends on ML service for predictions).

## Environment Variables Reference

### server/.env

| Variable               | Description                                            |
| ---------------------- | ------------------------------------------------------ |
| `NODE_ENV`             | Application environment (`development` / `production`) |
| `PORT`                 | Backend server port (default: `8000`)                  |
| `FRONTEND_URL`         | Allowed CORS origin for the frontend                   |
| `DATABASE`             | MongoDB Atlas connection string                        |
| `DATABASE_PASSWORD`    | MongoDB Atlas user password                            |
| `TOKEN_SECRET`         | JWT signing secret                                     |
| `TOKEN_EXPIRES_IN`     | JWT token expiry duration                              |
| `COOKIE_EXPIRES_IN`    | Cookie expiry in days                                  |
| `GOOGLE_CLIENT_ID`     | Google OAuth 2.0 client ID                             |
| `GOOGLE_CLIENT_SECRET` | Google OAuth 2.0 client secret                         |
| `GOOGLE_CALLBACK_URL`  | Google OAuth redirect URI                              |

### ml-service/.env

| Variable             | Description                          |
| -------------------- | ------------------------------------ |
| `MODEL_PATH`         | Path to saved ML model files         |
| `PORT`               | ML service port (default: `8001`)    |
| `ENVIRONMENT`        | Application environment              |
| `FRONTEND_URL`       | Allowed CORS origin for the frontend |
| `EXPRESS_SERVER_URL` | URL of the Express backend           |

---

## Google OAuth (Optional)

To enable Google login, you need a Google Cloud Console project:

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project or select existing
3. Navigate to **APIs & Services** → **Credentials**
4. Create an **OAuth 2.0 Client ID** (Web application)
5. Set **Authorized redirect URIs** to `http://localhost:8000/api/auth/google/redirect`
6. Copy the Client ID and Client Secret into `server/.env`:
   ```
   GOOGLE_CLIENT_ID=your-client-id
   GOOGLE_CLIENT_SECRET=your-client-secret
   ```

---

## Troubleshooting

| Issue                             | Solution                                                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **TensorFlow installation fails** | Ensure Python 3.9–3.11 is used. Install Visual C++ Redistributable. Try `pip install tensorflow==2.12.0` as fallback.    |
| **MongoDB connection error**      | In MongoDB Atlas, go to **Network Access** and add your IP address (`0.0.0.0/0` allows all IPs for development).         |
| **Port already in use**           | Change the port in the respective `.env` file. Update `FRONTEND_URL` / `EXPRESS_SERVER_URL` accordingly across services. |
| **CORS errors in browser**        | Ensure `FRONTEND_URL` in `server/.env` matches `http://localhost:3000` exactly (no trailing slash).                      |
| **ML service fails to start**     | Check TensorFlow installed correctly: `python -c "import tensorflow; print(tensorflow.__version__)"`.                    |
| **pnpm not recognized**           | Install it globally: `npm install -g pnpm`.                                                                              |
| **"Cannot find module" errors**   | Make sure `npm install` / `pnpm install` ran without errors. Delete `node_modules` and reinstall if needed.              |

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS, shadcn/ui, Recharts
- **Backend:** Node.js, Express 5, MongoDB / Mongoose, JWT, Passport.js (Google OAuth)
- **ML Service:** Python, FastAPI, TensorFlow 2, scikit-learn, yfinance, Pandas
