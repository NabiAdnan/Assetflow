# Assetflow

Assetflow is an asset management web application with a Python FastAPI backend
and a React/TypeScript frontend (`resource-flow-core`). This repository contains
both services and configuration for local development and deployment.

## Contents

- `backend/` — FastAPI app, database models, routers, and services.
- `frontend/resource-flow-core/` — Frontend app (Vite/React + TypeScript).
- `render.yaml` — Sample Render.com service + database configuration.

## Quickstart (local)

Prerequisites

- Python 3.11
- Node.js (16+ or the project's recommended version)
- Git

Backend (API)

1. Create and activate a virtualenv:

```bash
python -m venv .venv
source .venv/bin/activate   # Unix/macOS
.venv\Scripts\Activate     # Windows PowerShell
```

2. Install dependencies and run the app:

```bash
cd backend
pip install -r requirements.txt
# Optionally initialize the database
python -m app.database.init_db
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Frontend (development)

```bash
cd frontend/resource-flow-core
npm install
npm run dev
```

The frontend expects an API base URL available via `VITE_API_BASE_URL`.

## Environment

- See `render.yaml` for example environment variables used in deployment.
- Important variables for local testing:
  - `DATABASE_URL` — connection string for the DB
  - `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`

## Deploying

This project contains a `render.yaml` manifest suitable for deploying both
services and a Postgres database on Render.com. Adjust settings and secrets
in Render's dashboard as required.

## Notes about this repo

- The frontend folder `frontend/resource-flow-core` was previously a nested
  git repo; its files have been included and tracked in this repository so
  the `main` branch contains both backend and frontend for easier evaluation.

## Useful commands

- Commit and push main branch:

```bash
git add .
git commit -m "Describe your changes"
git push origin main
```

## Contributing

Feel free to open issues or PRs. For code changes, prefer small, focused
commits with clear messages.

## License

Add your license here.
