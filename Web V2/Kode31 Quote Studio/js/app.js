// app.js — bootstraps Firebase auth, wires the hash router, renders the app shell
// (side nav / bottom nav / top bar), and dispatches each route to its view module.

import './firebase.js';
import { el, clear, icon, card, tileIcon, button, emptyState, spinner, loadingScreen } from './ui.js';
import { initAuth, onAuthChange, isAdmin, getCurrentProfile, signOutUser, renderLoginView } from './auth.js';
import { resetDraft, setDivision, renderCustomerView, renderQuoteReviewView } from './quotes.js';
import { renderUniverseView } from './universe.js';
import { renderMultiverseView, renderAppsBusinessView, renderAppsModulesView, renderCategoryServicesView } from './multiverse.js';
import { renderDashboardView, renderQuoteDetailView, renderSignedCustomersView } from './dashboard.js';
import { renderAdminView, seedDatabase } from './settings.js';
import { db, COLLECTIONS } from './firebase.js';

const routes = [
  { path: '/', render: renderHomeView },
  { path: '/customer', render: (nav) => renderCustomerView(nav) },
  { path: '/universe', render: (nav) => renderUniverseView(nav) },
  { path: '/multiverse', render: (nav) => renderMultiverseView(nav) },
  { path: '/multiverse/apps', render: (nav) => renderAppsBusinessView(nav) },
  { path: '/multiverse/apps/:businessTypeId', render: (nav, p) => renderAppsModulesView(nav, p.businessTypeId) },
  { path: '/multiverse/:categorySlug', render: (nav, p) => renderCategoryServicesView(nav, p.categorySlug) },
  { path: '/quote', render: (nav) => renderQuoteReviewView(nav) },
  { path: '/dashboard', render: (nav) => renderDashboardView(nav) },
  { path: '/dashboard/:id', render: (nav, p) => renderQuoteDetailView(nav, p.id) },
  { path: '/signed-customers', render: (nav) => renderSignedCustomersView(nav) },
  { path: '/admin', render: (nav) => renderAdminView(nav), adminOnly: true },
];

let appRoot;
let contentRoot;
let currentCleanup = null;

// Hash changes are ordinary browser history entries, so "back" can just delegate
// to the browser's real history stack — no need to track our own.
function navigate(path) {
  if (path === -1) {
    history.back();
    return;
  }
  location.hash = `#${path}`;
}

function matchRoute(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  for (const route of routes) {
    const routeSegments = route.path.split('/').filter(Boolean);
    if (routeSegments.length !== segments.length) continue;
    const params = {};
    let ok = true;
    for (let i = 0; i < routeSegments.length; i++) {
      const rs = routeSegments[i];
      if (rs.startsWith(':')) params[rs.slice(1)] = decodeURIComponent(segments[i]);
      else if (rs !== segments[i]) { ok = false; break; }
    }
    if (ok) return { route, params };
  }
  return null;
}

function renderRoute() {
  const hash = location.hash.slice(1) || '/';

  // '/login' isn't a real route (the login screen is driven by auth state, not the router) —
  // once authenticated, treat it (and any other unknown hash) as home rather than a dead end.
  if (hash === '/login') {
    navigate('/');
    return;
  }

  const match = matchRoute(hash);

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  if (!match) {
    clear(contentRoot);
    contentRoot.appendChild(emptyState({ iconName: 'alertCircle', title: 'Page not found', action: button({ label: 'Go Home', onClick: () => navigate('/') }) }));
    return;
  }

  if (match.route.adminOnly && !isAdmin()) {
    navigate('/');
    return;
  }

  const node = match.route.render(navigate, match.params);
  clear(contentRoot);
  contentRoot.appendChild(node);
  if (node.cleanup) currentCleanup = node.cleanup;
  window.scrollTo({ top: 0 });
  updateNavActiveState(hash);
}

/* ============================== Shell ============================== */

const NAV_ITEMS = () => [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/dashboard', label: 'Quotes', icon: 'fileText' },
  { path: '/signed-customers', label: 'Signed', icon: 'users' },
  ...(isAdmin() ? [{ path: '/admin', label: 'Settings', icon: 'settings' }] : []),
];

function buildSideNav() {
  const sidenav = el('aside', { class: 'app-sidenav' });
  const profile = getCurrentProfile();

  sidenav.appendChild(
    el('div', { class: 'row', style: { gap: '10px', marginBottom: '32px', padding: '0 4px' } }, [
      el('div', { class: 'login-mark', style: { width: '36px', height: '36px', fontSize: '16px', borderRadius: '10px' } }, 'K'),
      el('div', {}, [el('p', { class: 'text-body-md' }, 'Kode31'), el('p', { class: 'text-caption' }, 'Quote Studio')]),
    ]),
  );

  const navList = el('nav', { class: 'stack', style: { gap: '4px', flex: 1 } });
  for (const item of NAV_ITEMS()) {
    navList.appendChild(el('a', { href: `#${item.path}`, class: 'nav-item', dataset: { path: item.path } }, [icon(item.icon, 20), item.label]));
  }
  sidenav.appendChild(navList);

  sidenav.appendChild(
    el('div', { class: 'row', style: { gap: '10px', padding: '10px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' } }, [
      el('span', { class: 'avatar' }, profile?.name?.slice(0, 1)?.toUpperCase() || '?'),
      el('div', { style: { flex: 1, minWidth: 0 } }, [
        el('p', { class: 'text-body', style: { fontSize: '13px' } }, profile?.name || ''),
        el('p', { class: 'text-caption', style: { textTransform: 'capitalize' } }, profile?.role || ''),
      ]),
      el('button', { class: 'btn btn-icon btn-sm btn-ghost', onClick: () => signOutUser(), 'aria-label': 'Sign out' }, [icon('logOut', 16)]),
    ]),
  );

  return sidenav;
}

function buildBottomNav() {
  const bottomnav = el('nav', { class: 'app-bottomnav' });
  for (const item of NAV_ITEMS()) {
    bottomnav.appendChild(el('a', { href: `#${item.path}`, class: 'bottomnav-item', dataset: { path: item.path } }, [icon(item.icon, 22), item.label]));
  }
  return bottomnav;
}

function buildShell() {
  const main = el('div', { class: 'app-main' });
  contentRoot = el('div', { class: 'app-content' });
  main.appendChild(contentRoot);
  return { sidenav: buildSideNav(), main, bottomnav: buildBottomNav() };
}

function updateNavActiveState(hash) {
  document.querySelectorAll('[data-path]').forEach((node) => {
    const path = node.dataset.path;
    const active = path === '/' ? hash === '/' : hash.startsWith(path);
    node.classList.toggle('is-active', active);
  });
}

/* ============================== Home view ============================== */

function renderHomeView(navigate) {
  const profile = getCurrentProfile();
  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(el('p', { class: 'text-secondary text-caption' }, profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Welcome'));
  wrapper.appendChild(el('h1', { class: 'heading-hero', style: { marginTop: '4px' } }, "Let's build a quote"));
  wrapper.appendChild(el('p', { class: 'text-secondary text-body', style: { marginTop: '8px', marginBottom: '24px', maxWidth: '420px' } }, 'Choose a division to begin. Everything updates live as you go.'));

  const grid = el('div', { class: 'division-grid' }, [spinner(true)]);
  wrapper.appendChild(grid);

  db.collection(COLLECTIONS.divisions)
    .orderBy('order', 'asc')
    .get()
    .then((snap) => {
      const divisions = snap.docs.map((d) => d.data());
      grid.innerHTML = '';

      if (divisions.length === 0) {
        const seedAction = isAdmin()
          ? button({
              label: 'Load Starter Catalog',
              onClick: async (e) => {
                e.target.closest('button').disabled = true;
                await seedDatabase();
                renderRoute();
              },
            })
          : el('p', { class: 'text-caption' }, 'Ask an admin to load the starter catalog.');
        grid.appendChild(
          emptyState({
            iconName: 'sparkle',
            title: 'Catalog is empty',
            description: 'Load the Kode31 starter catalog to get Universe and MultiVerse services set up in one click.',
            action: seedAction,
          }),
        );
        return;
      }

      for (const division of divisions) {
        grid.appendChild(
          card({
            interactive: true,
            className: 'division-card',
            onClick: () => {
              resetDraft();
              setDivision(division);
              navigate('/customer');
            },
            children: [
              tileIcon(division.icon),
              el('h2', { class: 'heading-lg', style: { marginTop: '20px' } }, division.name),
              el('p', { class: 'text-secondary text-body', style: { marginTop: '4px' } }, division.tagline),
              el('div', { class: 'division-card-arrow' }, [`Enter ${division.name}`, icon('arrowRight', 16)]),
            ],
          }),
        );
      }
    });

  return wrapper;
}

/* ============================== Boot ============================== */

function boot() {
  appRoot = document.getElementById('app');
  clear(appRoot);
  appRoot.appendChild(loadingScreen());

  initAuth();
  let shellUid = null; // the uid the current shell was built for

  onAuthChange((user, profile) => {
    if (!user) {
      shellUid = null;
      clear(appRoot);
      appRoot.appendChild(renderLoginView());
      return;
    }

    if (shellUid !== user.uid) {
      shellUid = user.uid;
      clear(appRoot);
      const { sidenav, main, bottomnav } = buildShell();
      appRoot.appendChild(sidenav);
      appRoot.appendChild(main);
      appRoot.appendChild(bottomnav);
      renderRoute();
      return;
    }

    // Same user, profile field changed (e.g. role) — just refresh nav visibility in place.
    if (profile) refreshShellNav();
  });
}

function refreshShellNav() {
  const oldSidenav = appRoot.querySelector('.app-sidenav');
  const oldBottomnav = appRoot.querySelector('.app-bottomnav');
  if (!oldSidenav || !oldBottomnav) return;
  oldSidenav.replaceWith(buildSideNav());
  oldBottomnav.replaceWith(buildBottomNav());
  updateNavActiveState(location.hash.slice(1) || '/');
}

window.addEventListener('hashchange', () => {
  if (contentRoot) renderRoute();
});

boot();
