# RAM Circuit Bench

Offline-first progressive web app for circuit design, visualization, and troubleshooting. Optimized for iOS **Add to Home Screen** and deployed from this repository via **GitHub Pages**.

## Development

```bash
npm install
npm run dev
```

Local builds use base path `/`. To match GitHub Pages:

```bash
VITE_BASE=/circuit-bench/ npm run build
```

## Deploy

Pushes to `main` run [.github/workflows/deploy-pages.yml](.github/workflows/deploy-pages.yml), which builds with `VITE_BASE=/circuit-bench/` and publishes `dist` to GitHub Pages.

In the repository **Settings → Pages**, set **Build and deployment** source to **GitHub Actions** if it is not already.

Live URL (after first successful deploy): [https://combsbw.github.io/circuit-bench/](https://combsbw.github.io/circuit-bench/)

## Stack

- Vite + React + TypeScript
- [@xyflow/react](https://reactflow.dev/) for the interactive canvas
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) + Workbox for offline caching

Product architecture and roadmap live in the Cursor Agent Store (`docs/architecture.md`, `docs/project-context.md`).