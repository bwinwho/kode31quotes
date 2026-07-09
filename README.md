# Kode31 Quote Studio

Internal tool for the Kode31 team to generate premium client quotations in
under two minutes — for both the **Universe** (music & creative) and
**MultiVerse** (digital & tech) divisions.

React + TypeScript + Tailwind CSS v4 + Firebase (Auth, Firestore, Storage,
Hosting), installable as a PWA.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in your Firebase project credentials
npm run dev
```

The first account created (via "Create an account" on the login screen)
automatically becomes an **admin**. Once signed in, if the catalog is empty
the Home screen offers a one-click "Load Starter Catalog" button (admin
only) that seeds Universe and MultiVerse with the default services described
in the product spec — every price, category, and service it creates is then
fully editable from **Admin Settings**. Nothing is hardcoded in the app
itself; Firestore is the single source of truth for pricing and catalog data.

### Local development against the Firebase Emulator Suite

Useful for testing without touching a real project:

```bash
npx firebase-tools emulators:start --only auth,firestore,storage
```

Then set in `.env.local`:

```
VITE_FIREBASE_PROJECT_ID=demo-kode31
VITE_USE_FIREBASE_EMULATOR=true
```

(any `demo-*` project ID works without real credentials or billing).

## Deploying

```bash
npm run build
npx firebase-tools deploy --only hosting,firestore:rules,storage:rules
```

`firestore.rules` and `storage.rules` restrict catalog/pricing/company
settings writes to admins, while any signed-in team member can create and
read quotes.

## Project structure

- `src/pages` — screens, organized by flow (`universe/`, `multiverse/`,
  `dashboard/`, `admin/`)
- `src/store/quoteStore.ts` — the in-progress quote builder (Zustand), used
  across the whole selection flow and kept in sync live
- `src/lib/firestoreService.ts` — all Firestore reads/writes
- `src/lib/seedData.ts` — the default starter catalog (Universe services,
  MultiVerse apps/websites/social/branding/design/automation/custom)
- `src/pdf/QuotePDFDocument.tsx` — the branded PDF layout (`@react-pdf/renderer`,
  lazy-loaded only when a PDF is generated)
- `src/types/index.ts` — the shared data model (divisions → categories →
  business types → services; quotes; company settings)
