# PCPGA Church Website (Firebase)

Vite + React + Firebase replacement for the original Next.js + Vercel + NeonDB site
(`Nexura-Business-Solutions/pcpga-church-website`).

Live: https://pcpga-church-prod.web.app

## Local development

```bash
npm install
npm run dev          # http://localhost:5173
```

## Tests

```bash
npm test                     # frontend tests (Vitest)
cd functions && npm test     # Cloud Functions tests (Vitest)
```

## Lint

```bash
npm run lint
```

## Deploy

```bash
firebase deploy --only hosting,firestore,storage    # frontend + rules
firebase deploy --only functions                    # Cloud Functions (requires Xendit secrets)
firebase deploy                                     # everything
```

The deploy account is currently `slowdee59@gmail.com` (Nexura). Firebase project is `pcpga-church-prod` (asia-southeast1).

## Architecture

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Handoff (adding admins, etc.)

See [`docs/HANDOFF.md`](docs/HANDOFF.md).
