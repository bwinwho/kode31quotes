// auth.js — Firebase Authentication, team-member profiles, and the login view.

import { auth, db, COLLECTIONS, nowMs } from './firebase.js';
import { el, button, textInput } from './ui.js';

let currentUser = null; // firebase.auth().currentUser
let currentProfile = null; // { uid, name, email, role, createdAt }
const listeners = [];

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function isAdmin() {
  return currentProfile?.role === 'admin';
}

/** Subscribe to (user, profile) changes. Returns an unsubscribe function. */
export function onAuthChange(cb) {
  listeners.push(cb);
  cb(currentUser, currentProfile);
  return () => {
    const i = listeners.indexOf(cb);
    if (i >= 0) listeners.splice(i, 1);
  };
}

function notify() {
  for (const cb of listeners) cb(currentUser, currentProfile);
}

/** Reads (or creates, for a brand-new signup) the Firestore profile for a signed-in user. */
async function ensureUserDoc(uid, name, email) {
  const ref = db.collection(COLLECTIONS.users).doc(uid);
  const snap = await ref.get();
  if (snap.exists) return snap.data();
  const usersSnap = await db.collection(COLLECTIONS.users).get();
  const role = usersSnap.empty ? 'admin' : 'member'; // first team member becomes admin
  const profile = { uid, name, email, role, createdAt: nowMs() };
  await ref.set(profile);
  return profile;
}

export function initAuth() {
  auth.onAuthStateChanged(async (user) => {
    currentUser = user;
    if (user) {
      currentProfile = await ensureUserDoc(user.uid, user.displayName || user.email || 'Team Member', user.email || '');
      // Keep the live profile in sync (role changes made by an admin, etc.)
      db.collection(COLLECTIONS.users)
        .doc(user.uid)
        .onSnapshot((snap) => {
          if (snap.exists) {
            currentProfile = snap.data();
            notify();
          }
        });
    } else {
      currentProfile = null;
    }
    notify();
  });
}

export async function signIn(email, password) {
  await auth.signInWithEmailAndPassword(email, password);
}

export async function signUp(name, email, password) {
  const cred = await auth.createUserWithEmailAndPassword(email, password);
  await cred.user.updateProfile({ displayName: name });
  await ensureUserDoc(cred.user.uid, name, email);
}

export async function signOutUser() {
  await auth.signOut();
}

/* ============================== Login view ============================== */

export function renderLoginView() {
  let mode = 'signin';

  const wrapper = el('div', { class: 'login-page' });

  function render() {
    wrapper.innerHTML = '';
    let name = '';
    let email = '';
    let password = '';
    let submitting = false;

    const errorBox = el('p', { class: 'text-caption', style: { color: 'var(--color-danger)', minHeight: '16px' } }, '');

    const nameField = mode === 'signup' ? textInput({ label: 'Full name', value: name, placeholder: 'Your name', onInput: (v) => (name = v), required: true }) : null;

    const form = el(
      'form',
      {
        class: 'stack',
        style: { gap: '16px' },
        onSubmit: async (e) => {
          e.preventDefault();
          if (submitting) return;
          submitting = true;
          errorBox.textContent = '';
          submitBtn.disabled = true;
          submitBtn.querySelector('span')?.remove();
          try {
            if (mode === 'signin') await signIn(email, password);
            else await signUp(name, email, password);
          } catch (err) {
            errorBox.textContent = friendlyAuthError(err);
          } finally {
            submitting = false;
            submitBtn.disabled = false;
          }
        },
      },
      [
        nameField,
        textInput({ label: 'Email', type: 'email', value: email, placeholder: 'you@kode31.com', required: true, onInput: (v) => (email = v) }),
        textInput({ label: 'Password', type: 'password', value: password, placeholder: '••••••••', required: true, onInput: (v) => (password = v) }),
        errorBox,
      ],
    );

    const submitBtn = button({ label: mode === 'signin' ? 'Sign In' : 'Create Account', variant: 'primary', size: 'lg', full: true, type: 'submit' });
    form.appendChild(submitBtn);

    const card = el('div', { class: 'card card-pad login-card animate-fade-up' }, [
      form,
      el(
        'button',
        {
          class: 'login-switch',
          type: 'button',
          onClick: () => {
            mode = mode === 'signin' ? 'signup' : 'signin';
            render();
          },
        },
        mode === 'signin' ? "New to the team? Create an account" : 'Already have an account? Sign in',
      ),
    ]);

    wrapper.appendChild(
      el('div', { class: 'login-brand animate-fade-up' }, [
        el('div', { class: 'login-mark' }, 'K'),
        el('div', { style: { textAlign: 'center' } }, [
          el('p', { class: 'heading-page' }, 'Kode31 Quote Studio'),
          el('p', { class: 'text-caption' }, 'Internal tool · Team access only'),
        ]),
      ]),
    );
    wrapper.appendChild(card);
    wrapper.appendChild(el('p', { class: 'text-caption', style: { marginTop: '32px', textAlign: 'center' } }, 'The first account created automatically becomes an admin.'));
  }

  render();
  return wrapper;
}

function friendlyAuthError(err) {
  const code = err?.code || '';
  const map = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/email-already-in-use': 'An account already exists with that email.',
    'auth/weak-password': 'Password should be at least 6 characters.',
  };
  return map[code] || err?.message || 'Something went wrong. Please try again.';
}
