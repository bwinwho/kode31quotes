// universe.js — the Universe (music & creative) catalog: default seed data + the
// service-list view. Universe is a flat catalog (no sub-categories) of original
// audio/music services — no distribution, live performance, or concert booking.

import { db, COLLECTIONS } from './firebase.js';
import { el, emptyState, spinner } from './ui.js';
import { getDraft, renderServiceCard, renderQuoteBar, pageHeader } from './quotes.js';

export const UNIVERSE_DIVISION = {
  id: 'universe',
  name: 'Universe',
  tagline: 'Music & Creative',
  icon: 'music',
  order: 1,
  active: true,
};

export const UNIVERSE_SEED_CATEGORY = { id: 'universe-catalog', divisionId: 'universe', name: 'Music & Creative', slug: 'catalog', icon: 'music', order: 1, active: true };

const vocalUpgrades = [
  { id: 'female-vocal', name: 'Female Vocal', price: 8000 },
  { id: 'male-vocal', name: 'Male Vocal', price: 8000 },
  { id: 'instrumental', name: 'Instrumental Version', price: 5000 },
  { id: 'extra-revision', name: 'Extra Revision', price: 3500 },
  { id: 'express-delivery', name: 'Express Delivery', price: 10000 },
  { id: 'alternate-mix', name: 'Alternate Mix', price: 6000 },
];

function makeService(suffix, name, price, includes, delivery, upgrades, order) {
  return {
    id: `universe-${suffix}`,
    divisionId: 'universe',
    categoryId: 'universe-catalog',
    businessTypeId: null,
    name,
    startingPrice: price,
    priceType: 'starting',
    deliveryTime: delivery,
    includes,
    optionalUpgrades: upgrades,
    annualCharges: [],
    bundlePricing: null,
    order,
    active: true,
  };
}

export const UNIVERSE_SEED_SERVICES = [
  makeService('original-song', 'Original Song', 45000, ['Lyrics', 'Composition', 'Production', 'Mixing', 'Mastering'], '3-4 weeks', vocalUpgrades, 1),
  makeService('brand-anthem', 'Brand Anthem', 35000, ['Concept', 'Lyrics', 'Composition', 'Production', 'Mixing & Mastering'], '2-3 weeks', vocalUpgrades, 2),
  makeService('jingle', 'Jingle', 15000, ['Concept', 'Composition', 'Production', 'Mixing & Mastering'], '1-2 weeks', vocalUpgrades.slice(0, 5), 3),
  makeService('background-music', 'Background Music', 8000, ['Composition', 'Production', 'Mastering'], '5-7 days', [vocalUpgrades[2], vocalUpgrades[3], vocalUpgrades[4]], 4),
  makeService('theme-music', 'Theme Music', 20000, ['Composition', 'Production', 'Mixing & Mastering'], '1-2 weeks', vocalUpgrades.slice(2), 5),
  makeService('podcast-intro', 'Podcast Intro', 6000, ['Composition', 'Sound Design', 'Mastering'], '3-5 days', [vocalUpgrades[3], vocalUpgrades[4]], 6),
  makeService('trailer-music', 'Trailer Music', 18000, ['Composition', 'Sound Design', 'Mixing & Mastering'], '1-2 weeks', vocalUpgrades.slice(2), 7),
  makeService('audio-branding', 'Audio Branding', 25000, ['Sonic Logo', 'Brand Theme', 'Usage Guidelines'], '2-3 weeks', [vocalUpgrades[3], vocalUpgrades[4]], 8),
  makeService('custom-project', 'Custom Project', 10000, ['Discovery Call', 'Tailored Scope', 'Custom Production'], 'Varies', vocalUpgrades, 9),
];

export function renderUniverseView(navigate) {
  const draft = getDraft();
  if (!draft.division || !draft.customer) {
    navigate('/');
    return el('div');
  }

  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(pageHeader('Music & Creative', `Quote for ${draft.customer.name}`, () => navigate(-1)));

  const list = el('div', { class: 'service-group-list' }, [spinner(true)]);
  wrapper.appendChild(list);

  let barSlot = el('div');
  wrapper.appendChild(barSlot);

  function refreshBar() {
    barSlot.innerHTML = '';
    const bar = renderQuoteBar(navigate);
    if (bar) barSlot.appendChild(bar);
  }

  db.collection(COLLECTIONS.services)
    .where('divisionId', '==', 'universe')
    .get()
    .then((snap) => {
      const services = snap.docs.map((d) => d.data()).filter((s) => s.active).sort((a, b) => a.order - b.order);
      list.innerHTML = '';
      if (services.length === 0) {
        list.appendChild(emptyState({ iconName: 'music', title: 'No services yet', description: 'Ask an admin to add Universe services in Settings.' }));
        return;
      }
      for (const service of services) {
        list.appendChild(renderServiceCard(service, 'Universe', null, refreshBar));
      }
    });

  refreshBar();
  return wrapper;
}
