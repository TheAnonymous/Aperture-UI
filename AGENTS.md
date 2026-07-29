# Repository instructions

- Do not add GitHub Actions or any other CI/CD pipeline.
- Run validation locally with `npm run lint`, `npm run build:pages`, and the
  relevant project tests.
- GitHub Pages publishes the committed static output from `main` → `/docs`.
- After UI changes, run `npm run build:pages` and commit the updated `docs/`
  output together with the source changes.
