// multiverse.js — the MultiVerse (digital & technology) catalog and its three-tier
// flow: category → (business type →) services. Apps is the only category with a
// business-type layer; everything else is a flat, modular service list so clients
// can buy individual pieces instead of a full system.

import { db, COLLECTIONS } from './firebase.js';
import { el, card, tileIcon, emptyState, spinner } from './ui.js';
import { getDraft, setCategoryPath, renderServiceCard, renderQuoteBar, pageHeader } from './quotes.js';

export const MULTIVERSE_DIVISION = {
  id: 'multiverse',
  name: 'MultiVerse',
  tagline: 'Digital & Technology',
  icon: 'layers',
  order: 2,
  active: true,
};

/* ============================== Seed data ============================== */

export const MULTIVERSE_SEED_CATEGORIES = [
  { id: 'apps', divisionId: 'multiverse', name: 'Apps', slug: 'apps', icon: 'smartphone', prompt: 'What are we building?', order: 1, active: true, hasBusinessTypes: true },
  { id: 'websites', divisionId: 'multiverse', name: 'Websites', slug: 'websites', icon: 'globe', prompt: 'What website do you need?', order: 2, active: true },
  { id: 'social-media', divisionId: 'multiverse', name: 'Social Media', slug: 'social-media', icon: 'sparkle', prompt: 'What content do you need?', order: 3, active: true },
  { id: 'branding', divisionId: 'multiverse', name: 'Branding', slug: 'branding', icon: 'tag', prompt: 'What branding do you need?', order: 4, active: true },
  { id: 'automation', divisionId: 'multiverse', name: 'Automation', slug: 'automation', icon: 'zap', prompt: 'What should we automate?', order: 5, active: true },
  { id: 'design', divisionId: 'multiverse', name: 'Design', slug: 'design', icon: 'palette', prompt: 'What design work do you need?', order: 6, active: true },
  { id: 'custom', divisionId: 'multiverse', name: 'Custom', slug: 'custom', icon: 'sparkle', prompt: 'Tell us what you need', order: 7, active: true },
];

const BUSINESS_TYPES = ['Restaurant', 'Cafe', 'Gym', 'Resort', 'Store', 'Business', 'Artist', 'School', 'Booking', 'Inventory', 'Custom'];
const BUSINESS_ICON = { Restaurant: 'building', Cafe: 'building', Gym: 'zap', Resort: 'mapPin', Store: 'tag', Business: 'building', Artist: 'music', School: 'identification', Booking: 'calendar', Inventory: 'package', Custom: 'sparkle' };

export const MULTIVERSE_SEED_BUSINESS_TYPES = BUSINESS_TYPES.map((name, i) => ({
  id: `apps-${name.toLowerCase()}`,
  categoryId: 'apps',
  name,
  icon: BUSINESS_ICON[name] || 'smartphone',
  order: i + 1,
  active: true,
}));

const MODULE_LIBRARY = [
  { suffix: 'digital-menu', name: 'Digital Menu', price: 6000, includes: ['Menu Design', 'QR Code', 'Live Updates'], delivery: '3-5 days' },
  { suffix: 'qr-menu', name: 'QR Menu', price: 4000, includes: ['QR Code Generation', 'Mobile-friendly Menu Page'], delivery: '2-3 days' },
  { suffix: 'website', name: 'Website', price: 8000, includes: ['Landing Page', 'Contact Details', 'Mobile Optimised'], delivery: '1 week' },
  { suffix: 'mobile-app', name: 'Mobile App', price: 45000, includes: ['iOS & Android App', 'Push Notifications', 'App Store Listing'], delivery: '4-6 weeks' },
  { suffix: 'ordering', name: 'Ordering', price: 18000, includes: ['Cart & Checkout', 'Order Tracking', 'Kitchen Notifications'], delivery: '2-3 weeks' },
  { suffix: 'booking', name: 'Booking', price: 16000, includes: ['Slot Booking', 'Calendar Sync', 'Reminders'], delivery: '2 weeks' },
  { suffix: 'loyalty', name: 'Loyalty', price: 12000, includes: ['Points System', 'Rewards Tiers', 'Customer Wallet'], delivery: '1-2 weeks' },
  { suffix: 'feedback', name: 'Feedback', price: 5000, includes: ['Ratings & Reviews', 'Feedback Forms'], delivery: '3-5 days' },
  { suffix: 'staff-dashboard', name: 'Staff Dashboard', price: 15000, includes: ['Role-based Access', 'Order Management', 'Reports'], delivery: '2 weeks' },
  { suffix: 'custom-feature', name: 'Custom Feature', price: 10000, includes: ['Scoped to your requirement'], delivery: 'Varies' },
];

const MODULE_SETS = {
  cafe: ['digital-menu', 'qr-menu', 'website', 'ordering', 'booking', 'loyalty', 'feedback', 'mobile-app'],
  restaurant: ['digital-menu', 'qr-menu', 'website', 'ordering', 'booking', 'loyalty', 'feedback', 'mobile-app'],
  gym: ['website', 'mobile-app', 'booking', 'loyalty', 'staff-dashboard', 'feedback', 'custom-feature'],
  resort: ['website', 'booking', 'mobile-app', 'loyalty', 'feedback', 'custom-feature'],
  store: ['digital-menu', 'ordering', 'website', 'mobile-app', 'loyalty', 'staff-dashboard', 'custom-feature'],
  business: ['website', 'mobile-app', 'staff-dashboard', 'booking', 'custom-feature'],
  artist: ['website', 'mobile-app', 'booking', 'feedback', 'custom-feature'],
  school: ['website', 'mobile-app', 'booking', 'staff-dashboard', 'feedback', 'custom-feature'],
  booking: ['booking', 'website', 'mobile-app', 'staff-dashboard', 'custom-feature'],
  inventory: ['staff-dashboard', 'mobile-app', 'website', 'custom-feature'],
  custom: ['custom-feature'],
};

function modulesFor(businessId, subset) {
  return MODULE_LIBRARY.filter((m) => subset.includes(m.suffix)).map((m, i) => ({
    id: `${businessId}-${m.suffix}`,
    divisionId: 'multiverse',
    categoryId: 'apps',
    businessTypeId: businessId,
    name: m.name,
    startingPrice: m.price,
    priceType: 'starting',
    deliveryTime: m.delivery,
    includes: m.includes,
    optionalUpgrades: [],
    annualCharges: [],
    bundlePricing: null,
    order: i + 1,
    active: true,
  }));
}

function makeWebsite(suffix, name, price, includes, delivery, order) {
  return {
    id: `website-${suffix}`,
    divisionId: 'multiverse',
    categoryId: 'websites',
    businessTypeId: null,
    name,
    startingPrice: price,
    priceType: 'starting',
    deliveryTime: delivery,
    includes,
    optionalUpgrades: [],
    annualCharges: [
      { id: 'hosting', name: 'Hosting', price: 4000, defaultIncluded: true },
      { id: 'domain', name: 'Domain', price: 1200, defaultIncluded: true },
      { id: 'maintenance', name: 'Maintenance', price: 6000, defaultIncluded: false },
    ],
    bundlePricing: null,
    order,
    active: true,
  };
}

function makeSimple(categoryId, suffix, name, price, includes, delivery, order) {
  return {
    id: `${categoryId}-${suffix}`,
    divisionId: 'multiverse',
    categoryId,
    businessTypeId: null,
    name,
    startingPrice: price,
    priceType: 'starting',
    deliveryTime: delivery,
    includes,
    optionalUpgrades: [],
    annualCharges: [],
    bundlePricing: null,
    order,
    active: true,
  };
}

const SPOTLIGHT_BOOST = { id: 'spotlight-boost', name: 'Spotlight Boost', price: 350 };

export const MULTIVERSE_SEED_SERVICES = [
  ...BUSINESS_TYPES.flatMap((name) => modulesFor(`apps-${name.toLowerCase()}`, MODULE_SETS[name.toLowerCase()] || ['custom-feature'])),

  makeWebsite('landing-page', 'Landing Page', 12000, ['Responsive Design', 'Mobile Optimised', 'Contact Form', 'SEO Basics', 'Analytics Setup'], '1 week', 1),
  makeWebsite('restaurant', 'Restaurant', 22000, ['Responsive Design', 'Menu Showcase', 'Contact & Location', 'SEO Basics'], '1-2 weeks', 2),
  makeWebsite('resort', 'Resort', 28000, ['Responsive Design', 'Gallery & Rooms', 'Booking Enquiry Form', 'SEO Basics'], '2 weeks', 3),
  makeWebsite('gym', 'Gym', 18000, ['Responsive Design', 'Membership Plans', 'Contact Form', 'SEO Basics'], '1-2 weeks', 4),
  makeWebsite('business', 'Business', 20000, ['Responsive Design', 'Multi-page Site', 'Contact Form', 'SEO Basics'], '1-2 weeks', 5),
  makeWebsite('artist', 'Artist', 16000, ['Responsive Design', 'Portfolio Showcase', 'Contact Form', 'SEO Basics'], '1-2 weeks', 6),
  makeWebsite('portfolio', 'Portfolio', 14000, ['Responsive Design', 'Project Showcase', 'Contact Form'], '1 week', 7),
  makeWebsite('ecommerce', 'Ecommerce', 45000, ['Responsive Design', 'Product Catalog', 'Cart & Checkout', 'Payment Gateway'], '3-4 weeks', 8),
  makeWebsite('blog', 'Blog', 15000, ['Responsive Design', 'CMS Setup', 'SEO Basics'], '1-2 weeks', 9),
  makeWebsite('custom', 'Custom', 20000, ['Discovery Call', 'Tailored Scope', 'Responsive Design'], 'Varies', 10),

  { id: 'social-post', divisionId: 'multiverse', categoryId: 'social-media', businessTypeId: null, name: 'Post', startingPrice: 750, priceType: 'fixed', includes: ['Design', 'Caption', 'Hashtags'], optionalUpgrades: [SPOTLIGHT_BOOST], annualCharges: [], bundlePricing: { enabled: true, unitLabel: 'post', unitPrice: 350, minUnits: 4, minUnitsLabel: '4 posts/month' }, order: 1, active: true },
  { id: 'social-story', divisionId: 'multiverse', categoryId: 'social-media', businessTypeId: null, name: 'Story', startingPrice: 500, priceType: 'fixed', includes: ['Design', 'Caption'], optionalUpgrades: [SPOTLIGHT_BOOST], annualCharges: [], bundlePricing: null, order: 2, active: true },
  { id: 'social-reel', divisionId: 'multiverse', categoryId: 'social-media', businessTypeId: null, name: 'Reel', startingPrice: 1500, priceType: 'fixed', includes: ['Concept', 'Editing', 'Caption', 'Hashtags'], optionalUpgrades: [SPOTLIGHT_BOOST], annualCharges: [], bundlePricing: null, order: 3, active: true },
  { id: 'social-short-video', divisionId: 'multiverse', categoryId: 'social-media', businessTypeId: null, name: 'Short Video', startingPrice: 2500, priceType: 'fixed', includes: ['Concept', 'Shoot Guidance', 'Editing'], optionalUpgrades: [SPOTLIGHT_BOOST], annualCharges: [], bundlePricing: null, order: 4, active: true },
  { id: 'social-monthly', divisionId: 'multiverse', categoryId: 'social-media', businessTypeId: null, name: 'Monthly Content', startingPrice: 350, priceType: 'bundle', includes: ['Design', 'Caption', 'Hashtags', 'Content Calendar'], optionalUpgrades: [SPOTLIGHT_BOOST], annualCharges: [], bundlePricing: { enabled: true, unitLabel: 'post', unitPrice: 350, minUnits: 4, minUnitsLabel: '4 posts/month' }, order: 5, active: true },

  makeSimple('branding', 'logo-design', 'Logo Design', 12000, ['3 Concepts', 'Unlimited Revisions on Selected', 'Final Files'], '1-2 weeks', 1),
  makeSimple('branding', 'brand-identity-kit', 'Brand Identity Kit', 28000, ['Logo Suite', 'Color Palette', 'Typography', 'Brand Applications'], '2-3 weeks', 2),
  makeSimple('branding', 'brand-guidelines', 'Brand Guidelines', 10000, ['Usage Rules', 'Do & Don’t', 'Brand Voice'], '1 week', 3),
  makeSimple('branding', 'stationery', 'Business Card & Stationery', 8000, ['Business Card', 'Letterhead', 'Email Signature'], '1 week', 4),

  makeSimple('automation', 'whatsapp-automation', 'WhatsApp Automation', 15000, ['Automated Replies', 'Order/Enquiry Flows', 'Broadcast Setup'], '1-2 weeks', 1),
  makeSimple('automation', 'workflow-automation', 'Workflow Automation', 18000, ['Process Mapping', 'Tool Integrations', 'Automated Triggers'], '2 weeks', 2),
  makeSimple('automation', 'crm-setup', 'CRM Setup', 20000, ['CRM Configuration', 'Pipeline Setup', 'Team Training'], '2 weeks', 3),
  makeSimple('automation', 'chatbot', 'Chatbot', 22000, ['Conversation Design', 'Integration', 'Testing'], '2-3 weeks', 4),

  makeSimple('design', 'social-templates', 'Social Media Templates', 6000, ['5 Editable Templates', 'Brand-matched Style'], '3-5 days', 1),
  makeSimple('design', 'presentation-deck', 'Presentation Deck', 9000, ['Custom Slide Design', 'Icons & Charts'], '1 week', 2),
  makeSimple('design', 'packaging-design', 'Packaging Design', 15000, ['Concept', 'Print-ready Files', 'Mockups'], '1-2 weeks', 3),
  makeSimple('design', 'print-design', 'Print Design', 7000, ['Flyers / Brochures', 'Print-ready Files'], '3-5 days', 4),

  makeSimple('custom', 'custom-project', 'Custom Project', 15000, ['Discovery Call', 'Tailored Scope', 'Dedicated Timeline'], 'Varies', 1),
];

/* ============================== Views ============================== */

function guardOrRedirect(navigate) {
  const draft = getDraft();
  if (!draft.division || !draft.customer) {
    navigate('/');
    return null;
  }
  return draft;
}

export function renderMultiverseView(navigate) {
  const draft = guardOrRedirect(navigate);
  if (!draft) return el('div');

  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(pageHeader('What do you need today?', `Quote for ${draft.customer.name}`, () => navigate(-1)));

  const grid = el('div', { class: 'picker-grid' }, [spinner(true)]);
  wrapper.appendChild(grid);

  db.collection(COLLECTIONS.categories)
    .where('divisionId', '==', 'multiverse')
    .get()
    .then((snap) => {
      const categories = snap.docs.map((d) => d.data()).filter((c) => c.active).sort((a, b) => a.order - b.order);
      grid.innerHTML = '';
      for (const cat of categories) {
        grid.appendChild(
          card({
            interactive: true,
            className: 'picker-card',
            pad: false,
            onClick: () => navigate(`/multiverse/${cat.slug}`),
            children: [tileIcon(cat.icon), el('span', { class: 'text-body-md', style: { fontSize: '14px' } }, cat.name)],
          }),
        );
      }
    });

  return wrapper;
}

export function renderAppsBusinessView(navigate) {
  const draft = guardOrRedirect(navigate);
  if (!draft) return el('div');

  const wrapper = el('div', { class: 'animate-fade-up' });
  wrapper.appendChild(pageHeader('What are we building?', 'Pick the closest match', () => navigate(-1)));

  const grid = el('div', { class: 'picker-grid' }, [spinner(true)]);
  wrapper.appendChild(grid);

  db.collection(COLLECTIONS.businessTypes)
    .where('categoryId', '==', 'apps')
    .get()
    .then((snap) => {
      const types = snap.docs.map((d) => d.data()).filter((b) => b.active).sort((a, b) => a.order - b.order);
      grid.innerHTML = '';
      for (const bt of types) {
        grid.appendChild(
          card({
            interactive: true,
            className: 'picker-card',
            pad: false,
            onClick: () => navigate(`/multiverse/apps/${bt.id}`),
            children: [tileIcon(bt.icon), el('span', { class: 'text-body-md', style: { fontSize: '14px' } }, bt.name)],
          }),
        );
      }
    });

  return wrapper;
}

export function renderAppsModulesView(navigate, businessTypeId) {
  const draft = guardOrRedirect(navigate);
  if (!draft) return el('div');

  const wrapper = el('div', { class: 'animate-fade-up' });
  const headerSlot = el('div');
  wrapper.appendChild(headerSlot);
  headerSlot.appendChild(pageHeader('Modules', 'Select one or many — clients only pay for what they need', () => navigate(-1)));

  const list = el('div', { class: 'service-group-list' }, [spinner(true)]);
  wrapper.appendChild(list);

  const barSlot = el('div');
  wrapper.appendChild(barSlot);
  function refreshBar() {
    barSlot.innerHTML = '';
    const bar = renderQuoteBar(navigate);
    if (bar) barSlot.appendChild(bar);
  }

  db.collection(COLLECTIONS.businessTypes)
    .doc(businessTypeId)
    .get()
    .then((btSnap) => {
      const bt = btSnap.exists ? btSnap.data() : null;
      headerSlot.innerHTML = '';
      headerSlot.appendChild(pageHeader(bt ? `${bt.name} Modules` : 'Modules', 'Select one or many — clients only pay for what they need', () => navigate(-1)));
      setCategoryPath(['Apps', bt?.name || '']);

      return db
        .collection(COLLECTIONS.services)
        .where('businessTypeId', '==', businessTypeId)
        .get()
        .then((snap) => {
          const services = snap.docs.map((d) => d.data()).filter((s) => s.active).sort((a, b) => a.order - b.order);
          list.innerHTML = '';
          if (services.length === 0) {
            list.appendChild(emptyState({ iconName: 'package', title: 'No modules yet', description: 'Ask an admin to add modules for this business type.' }));
            return;
          }
          for (const service of services) {
            list.appendChild(renderServiceCard(service, 'Apps', bt?.name, refreshBar));
          }
        });
    });

  refreshBar();
  return wrapper;
}

export function renderCategoryServicesView(navigate, categorySlug) {
  const draft = guardOrRedirect(navigate);
  if (!draft) return el('div');

  const wrapper = el('div', { class: 'animate-fade-up' });
  const headerSlot = el('div');
  wrapper.appendChild(headerSlot);

  const list = el('div', { class: 'service-group-list' }, [spinner(true)]);
  wrapper.appendChild(list);

  const barSlot = el('div');
  wrapper.appendChild(barSlot);
  function refreshBar() {
    barSlot.innerHTML = '';
    const bar = renderQuoteBar(navigate);
    if (bar) barSlot.appendChild(bar);
  }

  db.collection(COLLECTIONS.categories)
    .where('divisionId', '==', 'multiverse')
    .get()
    .then((snap) => {
      const category = snap.docs.map((d) => d.data()).find((c) => c.slug === categorySlug);
      headerSlot.innerHTML = '';
      headerSlot.appendChild(pageHeader(category?.name || 'Services', category?.prompt || '', () => navigate(-1)));
      if (!category) {
        list.innerHTML = '';
        list.appendChild(emptyState({ iconName: 'sparkle', title: 'Category not found' }));
        return;
      }
      setCategoryPath([category.name]);

      return db
        .collection(COLLECTIONS.services)
        .where('categoryId', '==', category.id)
        .get()
        .then((servicesSnap) => {
          const services = servicesSnap.docs.map((d) => d.data()).filter((s) => s.active && !s.businessTypeId).sort((a, b) => a.order - b.order);
          list.innerHTML = '';
          if (services.length === 0) {
            list.appendChild(emptyState({ iconName: 'sparkle', title: 'No services yet', description: 'Ask an admin to add services for this category.' }));
            return;
          }
          for (const service of services) {
            list.appendChild(renderServiceCard(service, category.name, null, refreshBar));
          }
        });
    });

  refreshBar();
  return wrapper;
}
