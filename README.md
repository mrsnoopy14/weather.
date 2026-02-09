# Simple Weather App (React + ES6)

Simple weather by city using Open-Meteo (no API key).

Live (GitHub Pages): https://mrsnoopy14.github.io/weather.12/

## Run locally

```bash
npm install
npm run dev
```

Open: http://127.0.0.1:5173/

## Build

```bash
npm run build
npm run preview
```

## Deploy (GitHub Pages)

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push to `main`
2. In GitHub: **Settings → Pages**
3. Set **Build and deployment** to **GitHub Actions**
4. The site will publish automatically

Note: Vite is configured to use a relative base path for production builds, so it works when hosted under a sub-path on GitHub Pages.
