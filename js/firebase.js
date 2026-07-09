// Firebase bootstrap. Uses the compat SDK (vendored locally as classic <script> tags in
// index.html, loaded before this module) so the rest of the app can stay dependency-free
// vanilla JS with no bundler.

const firebaseConfig = {
  apiKey: 'AIzaSyAHx24Osjm8Nx0rtu_meeOJyX17tjdo94g',
  authDomain: 'kode31-quotes.firebaseapp.com',
  projectId: 'kode31-quotes',
  storageBucket: 'kode31-quotes.firebasestorage.app',
  messagingSenderId: '514173110622',
  appId: '1:514173110622:web:baa3bdff269f2ff661a7cf',
};

// eslint-disable-next-line no-undef
const app = firebase.initializeApp(firebaseConfig);

export const auth = app.auth();
export const db = app.firestore();
export const storage = app.storage();

// Some networks (corporate proxies/VPNs/firewalls) don't cleanly support Firestore's default
// streaming transport. Auto-detect and fall back to long-polling so the app still works there.
db.settings({ experimentalAutoDetectLongPolling: true });

// Local development against the Firebase Emulator Suite: open with ?emulator=true
// (e.g. `firebase emulators:start` then http://localhost:5000/?emulator=true).
if (new URLSearchParams(location.search).get('emulator') === 'true') {
  auth.useEmulator('http://127.0.0.1:9099', { disableWarnings: true });
  db.useEmulator('127.0.0.1', 8080);
  storage.useEmulator('127.0.0.1', 9199);
}

export const COLLECTIONS = {
  users: 'users',
  divisions: 'divisions',
  categories: 'categories',
  businessTypes: 'businessTypes',
  services: 'services',
  quotes: 'quotes',
  settings: 'settings',
};

export const SETTINGS_DOC_ID = 'company';

/** Firestore rejects `undefined` field values — drop them before every write. */
export function stripUndefined(value) {
  return JSON.parse(JSON.stringify(value));
}

export function nowMs() {
  return Date.now();
}
