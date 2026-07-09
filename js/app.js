// app.js — bootstraps Firebase auth, wires the hash router, renders the app shell
// (side nav / bottom nav / top bar), and dispatches each route to its view module.

import './firebase.js';
import { el, clear, icon, button, emptyState, spinner, loadingScreen, glowIcon, brandMark } from './ui.js';
import { initAuth, onAuthChange, isAdmin, getCurrentProfile, signOutUser, renderLoginView } from './auth.js';
import { resetDraft, setDivision, renderCustomerView, renderQuoteReviewView } from './quotes.js';
import { renderUniverseView } from './universe.js';
import { renderMultiverseView, renderAppsBusinessView, renderAppsModulesView, renderCategoryServicesView } from './multiverse.js';
import { renderDashboardView, renderQuoteDetailView, renderSignedCustomersView } from './dashboard.js';
import { renderAdminView, seedDatabase } from './settings.js';
import { db, COLLECTIONS } from './firebase.js';

const routes = [
  { path: '/', render: renderHomeView, fixed: true },
  { path: '/customer', render: (nav) => renderCustomerView(nav), fixed: true },
  { path: '/universe', render: (nav) => renderUniverseView(nav) },
  { path: '/multiverse', render: (nav) => renderMultiverseView(nav), fixed: true },
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

  // Fixed flows fill exactly one viewport and never scroll the window.
  document.body.classList.toggle('view-fixed', !!match.route.fixed);

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
      brandMark({ size: 38, rounded: '11px' }),
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
    bottomnav.appendChild(
      el('a', { href: `#${item.path}`, class: 'bottomnav-item', dataset: { path: item.path } }, [
        el('span', { class: 'bn-icon' }, [icon(item.icon, 21)]),
        el('span', {}, item.label),
        el('span', { class: 'bn-dot' }),
      ]),
    );
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
  const view = el('div', { class: 'home-view animate-fade-up' });

  const hero = el('div', { class: 'home-hero' }, [
    el('p', { class: 'home-eyebrow' }, 'Kode31 Quote Studio'),
    el('h1', { class: 'text-display home-title' }, ['Time to', el('br'), el('span', { class: 'text-metallic' }, 'Quote')]),
    el('p', { class: 'home-sub text-secondary' }, ['Create professional quotes', el('br'), 'in under a minute.']),
    el('div', { class: 'home-divider' }),
  ]);
  view.appendChild(hero);

  const list = el('div', { class: 'division-list' }, [spinner(true)]);
  view.appendChild(list);

  db.collection(COLLECTIONS.divisions)
    .orderBy('order', 'asc')
    .get()
    .then((snap) => {
      const divisions = snap.docs.map((d) => d.data());
      list.innerHTML = '';

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
        list.appendChild(
          emptyState({
            iconName: 'sparkle',
            title: 'Catalog is empty',
            description: 'Load the Kode31 starter catalog to get Universe and MultiVerse services set up in one click.',
            action: seedAction,
          }),
        );
        return;
      }

      divisions.forEach((division, i) => {
        list.appendChild(
          el(
            'button',
            {
              class: 'division-card',
              type: 'button',
              style: { animationDelay: `${i * 70}ms` },
              onClick: () => {
                resetDraft();
                setDivision(division);
                navigate('/customer');
              },
            },
            [
              glowIcon(division.icon, 26),
              el('div', { class: 'division-card-text' }, [
                el('p', { class: 'division-card-title' }, division.name),
                el('p', { class: 'division-card-sub text-secondary' }, division.tagline),
              ]),
              el('span', { class: 'division-card-chevron' }, [icon('chevronRight', 20)]),
            ],
          ),
        );
      });
    });

  return view;
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
      document.body.classList.remove('view-fixed');
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
