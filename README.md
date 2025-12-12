# Viewmodel

TypeScript helpers for building view models that play nicely with React and real‑time data sources. It includes generic sources (static, HTTP, websocket), update helpers, and a small React integration layer.

## Getting Started

```bash
npm install
```

## Scripts

- `npm run build` — bundle `src/index.ts` and `src/react.ts` with type declarations (tsup).
- `npm test` — run the Vitest suite.
- `npm run coverage` — run tests with coverage; open `coverage/index.html` for the HTML report.

## Notes

- Tests are written with Vitest; coverage uses the v8 provider.
- Builds target both ESM and CJS outputs with declarations in `dist/`.
- Source code is TypeScript and uses `zod` for runtime validation in places.

## License

ISC. See `LICENSE`.
