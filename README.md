# Aperture UI

A camera-inspired React component showcase built around restrained typography,
precision controls, monochrome instrument surfaces, and accessible interaction.

## Live demo

GitHub Pages publishes the committed static build from `main` → `/docs`:

<https://theanonymous.github.io/Aperture-UI/>

The project intentionally does **not** use GitHub Actions or another CI/CD
pipeline.

## What is included

- foundations, tokens, controls, navigation, data tables, dialogs, and precision inputs
- command palette, view menu, quick settings, and keyboard interaction
- histogram, exposure meter, ISO dial, grain, and capture metadata
- RAW dropzone, processing queue, tonal range, loading, empty, and feedback states
- responsive desktop/mobile layouts and light/dark themes

The visual language is an original camera-instrument design. It does not include
Leica logos, wordmarks, or other brand assets.

## Local development

Requirements:

- Node.js `>=22.13.0`
- npm

```bash
npm ci
npm run dev
```

## Validation

```bash
npm run lint
npm run build:pages
```

`npm run build:pages` creates the deployable static site in `docs/`. Commit that
folder whenever the GitHub Pages version should be updated.

## Hosting

The repository supports two independent hosting targets:

- GitHub Pages: static build from `docs/`
- OpenAI Sites: the Vinext/Cloudflare build produced by `npm run build`

GitHub Pages must remain configured as **Deploy from a branch**, using branch
`main` and folder `/docs`. Do not add workflow files under `.github/workflows/`.
