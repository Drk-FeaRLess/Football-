# Football Simulator (Vercel-ready)

This repository contains a React frontend and a serverless backend (`/api/simulate`) ready for deployment on Vercel.

## What it does
- Frontend: simple React UI to request match simulation.
- Backend: serverless function that fetches H2H data from API-Football (`/fixtures/headtohead`) and returns probability matrix and top scorelines using a Poisson model.

## Environment variables (set these in Vercel Dashboard)
- `API_KEY` - Your API-Football key (x-apisports-key header)
- `API_BASE` - (optional) API base URL, default: https://v3.football.api-sports.io

## One-click deploy (manual steps)
1. Create a GitHub repository and push this project:
```bash
git init
git add .
git commit -m "init"
gh repo create your-username/football-sim-vercel --public --source=. --remote=origin
git push -u origin main
```
(If you don't have `gh`, create a repo manually on GitHub and push.)

2. Go to Vercel -> Import Project -> Select your GitHub repo -> Deploy.

3. In Vercel project settings -> Environment Variables, add `API_KEY` (and optionally `API_BASE`).

4. After deployment, your site will be live at `https://<project-name>.vercel.app`.

## Local dev
```
npm install
npm run dev
```

## Notes
- The serverless function expects API-Football response format. Adjust parsing if you use another provider.
- For production, consider adding caching (Redis) and rate-limiting.

