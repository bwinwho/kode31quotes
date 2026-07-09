# Kode31 Quote Studio — Web V2

A from-scratch rebuild in plain HTML/CSS/vanilla JavaScript (ES modules) — no
React, no build step, no `npm install` required to run it. Firebase (Auth,
Firestore, Storage) and jsPDF are vendored locally under `assets/vendor/`, so
the only external service this app talks to is your Firebase project itself.

## Run it

Any static file server works — this is plain files, nothing to build.

```bash
cd "Web V2/Kode31 Quote Studio"
python3 -m http.server 8000
# open http://localhost:8000
```

Or with Node (if you have it): `npx serve .` Or just use the "Live Server"
VS Code extension. There is no `npm install` step for the app itself.

The Firebase project config is already wired up in `js/firebase.js` (project
`kode31-quotes`). The first account you create on the login screen
automatically becomes an **admin**. From Home, an admin can click **"Load
Starter Catalog"** to seed Universe and MultiVerse with the default services
described in the product spec — every price/category/service it creates is
then fully editable from **Admin Settings**. Nothing is hardcoded in the app
itself; Firestore is the single source of truth for pricing and catalog data.

### Testing against the Firebase Emulator Suite

Useful for trying things out without touching real data:

```bash
npx firebase-tools emulators:start --only auth,firestore,storage
```

Then open `http://localhost:8000/?emulator=true` — the app detects the query
param and points Auth/Firestore/Storage at `127.0.0.1:9099/8080/9199`.

## Deploying

```bash
npx firebase-tools deploy --only hosting,firestore:rules,storage:rules
```

(`.firebaserc` already points at the `kode31-quotes` project.)

## Project structure

```
index.html            single-page shell; loads vendored Firebase + jsPDF, then js/app.js
css/
  variables.css        design tokens — colors, spacing, radius, shadows, type scale
  layout.css            reset + app shell (side nav / bottom nav / content)
  typography.css        heading/body/caption classes
  components.css         buttons, cards, inputs, badges, dialogs, sheets, toasts, nav
  animations.css        keyframes + transition utility classes
  pages.css              page-specific layout (login, home, service cards, dashboard, admin)
js/
  app.js                hash router, top nav shell, auth guard — wires everything together
  firebase.js            Firebase init (compat SDK) + shared collection/util helpers
  ui.js                  the design system: el() DOM builder, icon set, all reusable components
  auth.js                sign in/up, team profiles, first-user-becomes-admin, login view
  quotes.js               quote draft state, shared service-selection card, customer + review views,
                          Firestore CRUD for saved quotes
  universe.js             Universe (music & creative) default catalog + service list view
  multiverse.js           MultiVerse categories/business-types/modules default catalog + views
  pdf.js                  jsPDF branded quotation layout
  dashboard.js            stats, search/filter, quote detail, duplicate/edit/delete, Signed Customers
  settings.js             admin-only: catalog CRUD (services/categories/business types) + company/bank/GST/logo
assets/
  vendor/firebase/        vendored Firebase compat SDK (no CDN dependency)
  vendor/jspdf/           vendored jsPDF UMD build
  fonts/                  self-hosted Inter woff2 files
icons/favicon.svg
```

## Verification

This build was tested end-to-end against a local Firebase Emulator Suite
instance configured with this project's real `projectId` (via
`?emulator=true`) using a scripted Playwright walkthrough: sign-up →
first-user-becomes-admin → seed catalog → Universe flow → MultiVerse → Apps →
Cafe modules → quote save → PDF download → Dashboard → Admin Settings. Two
real bugs were caught and fixed in the process: a CSS Grid overflow on
narrow/mobile two-column enhancement toggles, and a routing edge case for the
`#/login` hash. Connectivity to the real `kode31-quotes` Firebase endpoints
(Identity Toolkit + Firestore REST) was separately confirmed reachable.
