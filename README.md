# Bloom Expense Tracker

Bloom is a personal finance dashboard for tracking income, expenses, monthly budgets, and spending trends. It includes account registration and sign-in, transaction management, profile settings, and light and dark themes.

## Technology

- Frontend: Next.js, React, TypeScript, and Tailwind CSS
- Backend: Express and Mongoose
- Database: MongoDB

## Requirements

- Node.js 20.9 or later and npm
- A MongoDB database for running the backend

## Run locally

Install dependencies and configure the backend:

```sh
cd backend
npm ci
```

Copy `backend/.env.example` to `backend/.env`, then set `MONGODB_URI` to your MongoDB connection string. For local development, the example values use port `4000` and frontend origin `http://localhost:3000`.

In one terminal, start the API:

```sh
cd backend
npm run dev
```

In another terminal, configure and start the frontend:

```sh
cd frontend
npm ci
```

Copy `frontend/.env.local.example` to `frontend/.env.local`. Set `NEXT_PUBLIC_API_URL` to the API's base URL (locally, `http://localhost:4000`), then run:

```sh
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The API health check is available at [http://localhost:4000/health](http://localhost:4000/health).

Keep the frontend and backend running in separate terminals. Environment files contain local configuration and must not be committed; use the example files as templates.

## Checks

Run these commands from their respective directories:

```sh
# frontend
npm run lint
npm run build

# backend
npm test
```

## Deployment

Deploy the Next.js frontend to a host that supports Next.js and deploy the Express API separately. The API requires a reachable MongoDB database. Configure:

- Frontend `NEXT_PUBLIC_API_URL` as the public API base URL.
- Backend `MONGODB_URI` as the production database connection string.
- Backend `FRONTEND_ORIGIN` as the exact public frontend origin. Multiple comma-separated origins are supported.
- Backend `NODE_ENV=production` and, if needed, `PORT` as required by the API host.

The browser must be able to reach the API over HTTPS in production. The API uses credentialed requests and secure cookies in production, so configure the frontend origin and API host accordingly.

GitHub is suitable for hosting this source code, but GitHub Pages does not run the Express API or MongoDB. This project is not configured for a standalone GitHub Pages deployment.

## Install Bloom

Bloom includes a web app manifest and can be installed from a supported browser when served over HTTPS (or from `localhost` during development). Use the browser's install option to add it to your device. Its service worker caches static app assets and shows an offline notice when navigation cannot reach the server; account and finance features still require a network connection. API responses and personal finance data are not cached.
