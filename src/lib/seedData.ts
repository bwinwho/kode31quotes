import type {
  BusinessType,
  Category,
  CompanySettings,
  Division,
  Service,
  UpgradeOption,
} from '@/types';

// Default starter catalog. This is written into Firestore once (via Admin Settings > "Load starter catalog")
// and is fully editable/deletable afterwards — nothing here is read at runtime as a hardcoded price.

export const seedDivisions: Division[] = [
  {
    id: 'universe',
    name: 'Universe',
    tagline: 'Music & Creative',
    icon: '🌌',
    colorFrom: '#6a4bf5',
    colorTo: '#9a80ff',
    order: 1,
    active: true,
  },
  {
    id: 'multiverse',
    name: 'MultiVerse',
    tagline: 'Digital & Tech',
    icon: '🚀',
    colorFrom: '#17b0a8',
    colorTo: '#4fd0c8',
    order: 2,
    active: true,
  },
];

const vocalUpgrades: UpgradeOption[] = [
  { id: 'female-vocal', name: 'Female Vocal', price: 8000 },
  { id: 'male-vocal', name: 'Male Vocal', price: 8000 },
  { id: 'instrumental', name: 'Instrumental Version', price: 5000 },
  { id: 'extra-revision', name: 'Extra Revision', price: 3500 },
  { id: 'express-delivery', name: 'Express Delivery', price: 10000 },
  { id: 'alternate-mix', name: 'Alternate Mix', price: 6000 },
];

export const seedCategories: Category[] = [
  { id: 'universe-catalog', divisionId: 'universe', name: 'Music & Creative', slug: 'catalog', icon: '🎵', order: 1, active: true },
  { id: 'apps', divisionId: 'multiverse', name: 'Apps', slug: 'apps', prompt: 'What are we building?', icon: '📱', order: 1, active: true, hasBusinessTypes: true, allowMultiSelect: true },
  { id: 'websites', divisionId: 'multiverse', name: 'Websites', slug: 'websites', prompt: 'What website do you need?', icon: '🌐', order: 2, active: true },
  { id: 'social-media', divisionId: 'multiverse', name: 'Social Media', slug: 'social-media', prompt: 'What content do you need?', icon: '✨', order: 3, active: true, allowMultiSelect: true },
  { id: 'branding', divisionId: 'multiverse', name: 'Branding', slug: 'branding', prompt: 'What branding do you need?', icon: '🎯', order: 4, active: true },
  { id: 'design', divisionId: 'multiverse', name: 'Design', slug: 'design', prompt: 'What design work do you need?', icon: '🎨', order: 5, active: true },
  { id: 'automation', divisionId: 'multiverse', name: 'Automation', slug: 'automation', prompt: 'What should we automate?', icon: '⚙️', order: 6, active: true },
  { id: 'custom', divisionId: 'multiverse', name: 'Custom', slug: 'custom', prompt: 'Tell us what you need', icon: '💡', order: 7, active: true },
];

export const seedBusinessTypes: BusinessType[] = [
  'Gym', 'Cafe', 'Restaurant', 'Resort', 'Business', 'Store', 'Artist',
  'School', 'Booking', 'Inventory', 'Delivery', 'Community', 'Custom',
].map((name, i) => ({
  id: `apps-${name.toLowerCase()}`,
  categoryId: 'apps',
  name,
  icon: businessIcon(name),
  order: i + 1,
  active: true,
}));

function businessIcon(name: string): string {
  const map: Record<string, string> = {
    Gym: '💪', Cafe: '☕', Restaurant: '🍽️', Resort: '🏝️', Business: '🏢',
    Store: '🛍️', Artist: '🎤', School: '🎓', Booking: '📅', Inventory: '📦',
    Delivery: '🛵', Community: '👥', Custom: '💡',
  };
  return map[name] ?? '📱';
}

const commonModules: Array<{ suffix: string; name: string; price: number; includes: string[]; delivery: string }> = [
  { suffix: 'digital-menu', name: 'Digital Menu', price: 6000, includes: ['Menu Design', 'QR Code', 'Live Updates'], delivery: '3-5 days' },
  { suffix: 'qr-menu', name: 'QR Menu', price: 4000, includes: ['QR Code Generation', 'Mobile-friendly Menu Page'], delivery: '2-3 days' },
  { suffix: 'mobile-app', name: 'Mobile App', price: 45000, includes: ['iOS & Android App', 'Push Notifications', 'App Store Listing'], delivery: '4-6 weeks' },
  { suffix: 'ordering-system', name: 'Ordering System', price: 18000, includes: ['Cart & Checkout', 'Order Tracking', 'Kitchen Notifications'], delivery: '2-3 weeks' },
  { suffix: 'loyalty-program', name: 'Loyalty Program', price: 12000, includes: ['Points System', 'Rewards Tiers', 'Customer Wallet'], delivery: '1-2 weeks' },
  { suffix: 'staff-dashboard', name: 'Staff Dashboard', price: 15000, includes: ['Role-based Access', 'Order Management', 'Reports'], delivery: '2 weeks' },
  { suffix: 'feedback-system', name: 'Feedback System', price: 5000, includes: ['Ratings & Reviews', 'Feedback Forms'], delivery: '3-5 days' },
  { suffix: 'booking-system', name: 'Booking System', price: 16000, includes: ['Slot Booking', 'Calendar Sync', 'Reminders'], delivery: '2 weeks' },
  { suffix: 'custom-feature', name: 'Custom Feature', price: 10000, includes: ['Scoped to your requirement'], delivery: 'Varies' },
];

function modulesFor(businessId: string, subset: string[]): Service[] {
  return commonModules
    .filter((m) => subset.includes(m.suffix))
    .map((m, i) => ({
      id: `${businessId}-${m.suffix}`,
      divisionId: 'multiverse',
      categoryId: 'apps',
      businessTypeId: businessId,
      name: m.name,
      startingPrice: m.price,
      priceType: 'starting' as const,
      deliveryTime: m.delivery,
      includes: m.includes,
      optionalUpgrades: [],
      annualCharges: [],
      order: i + 1,
      active: true,
    }));
}

const allModuleSuffixes = commonModules.map((m) => m.suffix);

const rawSeedServices: Service[] = [
  // Universe — music & creative audio
  makeUniverse('original-song', 'Original Song', 45000, ['Lyrics', 'Composition', 'Production', 'Mixing', 'Mastering'], '3-4 weeks', vocalUpgrades),
  makeUniverse('brand-anthem', 'Brand Anthem', 35000, ['Concept', 'Lyrics', 'Composition', 'Production', 'Mixing & Mastering'], '2-3 weeks', vocalUpgrades),
  makeUniverse('jingle', 'Jingle', 15000, ['Concept', 'Composition', 'Production', 'Mixing & Mastering'], '1-2 weeks', vocalUpgrades.slice(0, 5)),
  makeUniverse('background-music', 'Background Music', 8000, ['Composition', 'Production', 'Mastering'], '5-7 days', [vocalUpgrades[2]!, vocalUpgrades[3]!, vocalUpgrades[4]!]),
  makeUniverse('theme-music', 'Theme Music', 20000, ['Composition', 'Production', 'Mixing & Mastering'], '1-2 weeks', vocalUpgrades.slice(2)),
  makeUniverse('podcast-intro', 'Podcast Intro', 6000, ['Composition', 'Sound Design', 'Mastering'], '3-5 days', [vocalUpgrades[3]!, vocalUpgrades[4]!]),
  makeUniverse('trailer-music', 'Trailer Music', 18000, ['Composition', 'Sound Design', 'Mixing & Mastering'], '1-2 weeks', vocalUpgrades.slice(2)),
  makeUniverse('audio-branding', 'Audio Branding', 25000, ['Sonic Logo', 'Brand Theme', 'Usage Guidelines'], '2-3 weeks', [vocalUpgrades[3]!, vocalUpgrades[4]!]),
  makeUniverse('custom-project-universe', 'Custom Project', 10000, ['Discovery Call', 'Tailored Scope', 'Custom Production'], 'Varies', vocalUpgrades),

  // MultiVerse > Apps > business modules
  ...modulesFor('apps-cafe', allModuleSuffixes),
  ...modulesFor('apps-restaurant', allModuleSuffixes),
  ...modulesFor('apps-gym', ['mobile-app', 'booking-system', 'loyalty-program', 'staff-dashboard', 'feedback-system', 'custom-feature']),
  ...modulesFor('apps-resort', ['booking-system', 'mobile-app', 'loyalty-program', 'feedback-system', 'custom-feature']),
  ...modulesFor('apps-business', ['mobile-app', 'staff-dashboard', 'booking-system', 'custom-feature']),
  ...modulesFor('apps-store', ['digital-menu', 'ordering-system', 'mobile-app', 'loyalty-program', 'staff-dashboard', 'custom-feature']),
  ...modulesFor('apps-artist', ['mobile-app', 'booking-system', 'feedback-system', 'custom-feature']),
  ...modulesFor('apps-school', ['mobile-app', 'booking-system', 'staff-dashboard', 'feedback-system', 'custom-feature']),
  ...modulesFor('apps-booking', ['booking-system', 'mobile-app', 'staff-dashboard', 'custom-feature']),
  ...modulesFor('apps-inventory', ['staff-dashboard', 'mobile-app', 'custom-feature']),
  ...modulesFor('apps-delivery', ['ordering-system', 'mobile-app', 'staff-dashboard', 'custom-feature']),
  ...modulesFor('apps-community', ['mobile-app', 'booking-system', 'feedback-system', 'custom-feature']),
  ...modulesFor('apps-custom', ['custom-feature']),

  // MultiVerse > Websites
  makeWebsite('landing-page', 'Landing Page', 12000, ['Responsive Design', 'Mobile Optimised', 'Contact Form', 'SEO Basics', 'Analytics Setup'], '1 week'),
  makeWebsite('restaurant-website', 'Restaurant', 22000, ['Responsive Design', 'Menu Showcase', 'Contact & Location', 'SEO Basics', 'Analytics Setup'], '1-2 weeks'),
  makeWebsite('resort-website', 'Resort', 28000, ['Responsive Design', 'Gallery & Rooms', 'Booking Enquiry Form', 'SEO Basics', 'Analytics Setup'], '2 weeks'),
  makeWebsite('gym-website', 'Gym', 18000, ['Responsive Design', 'Membership Plans', 'Contact Form', 'SEO Basics', 'Analytics Setup'], '1-2 weeks'),
  makeWebsite('business-website', 'Business', 20000, ['Responsive Design', 'Multi-page Site', 'Contact Form', 'SEO Basics', 'Analytics Setup'], '1-2 weeks'),
  makeWebsite('artist-website', 'Artist', 16000, ['Responsive Design', 'Portfolio Showcase', 'Contact Form', 'SEO Basics', 'Analytics Setup'], '1-2 weeks'),
  makeWebsite('portfolio-website', 'Portfolio', 14000, ['Responsive Design', 'Project Showcase', 'Contact Form', 'SEO Basics'], '1 week'),
  makeWebsite('ecommerce-website', 'Ecommerce', 45000, ['Responsive Design', 'Product Catalog', 'Cart & Checkout', 'Payment Gateway', 'SEO Basics', 'Analytics Setup'], '3-4 weeks'),
  makeWebsite('blog-website', 'Blog', 15000, ['Responsive Design', 'CMS Setup', 'SEO Basics', 'Analytics Setup'], '1-2 weeks'),
  makeWebsite('custom-website', 'Custom', 20000, ['Discovery Call', 'Tailored Scope', 'Responsive Design'], 'Varies'),

  // MultiVerse > Social Media
  {
    id: 'social-single-post',
    divisionId: 'multiverse',
    categoryId: 'social-media',
    name: 'Single Post',
    startingPrice: 750,
    priceType: 'fixed',
    includes: ['Design', 'Caption', 'Hashtags'],
    optionalUpgrades: [{ id: 'spotlight-boost', name: 'Spotlight Boost', price: 350 }],
    annualCharges: [],
    bundlePricing: { enabled: true, unitLabel: 'post', unitPrice: 350, minUnits: 4, minUnitsLabel: '4 posts/month' },
    order: 1,
    active: true,
  },
  {
    id: 'social-story',
    divisionId: 'multiverse',
    categoryId: 'social-media',
    name: 'Story',
    startingPrice: 500,
    priceType: 'fixed',
    includes: ['Design', 'Caption'],
    optionalUpgrades: [{ id: 'spotlight-boost', name: 'Spotlight Boost', price: 350 }],
    annualCharges: [],
    order: 2,
    active: true,
  },
  {
    id: 'social-reel',
    divisionId: 'multiverse',
    categoryId: 'social-media',
    name: 'Reel',
    startingPrice: 1500,
    priceType: 'fixed',
    includes: ['Concept', 'Editing', 'Caption', 'Hashtags'],
    optionalUpgrades: [{ id: 'spotlight-boost', name: 'Spotlight Boost', price: 350 }],
    annualCharges: [],
    order: 3,
    active: true,
  },
  {
    id: 'social-short-video',
    divisionId: 'multiverse',
    categoryId: 'social-media',
    name: 'Short Video',
    startingPrice: 2500,
    priceType: 'fixed',
    includes: ['Concept', 'Shoot Guidance', 'Editing', 'Caption'],
    optionalUpgrades: [{ id: 'spotlight-boost', name: 'Spotlight Boost', price: 350 }],
    annualCharges: [],
    order: 4,
    active: true,
  },
  {
    id: 'social-monthly-plan',
    divisionId: 'multiverse',
    categoryId: 'social-media',
    name: 'Monthly Content Plan',
    startingPrice: 350,
    priceType: 'bundle',
    includes: ['Design', 'Caption', 'Hashtags', 'Content Calendar'],
    optionalUpgrades: [{ id: 'spotlight-boost', name: 'Spotlight Boost', price: 350 }],
    annualCharges: [],
    bundlePricing: { enabled: true, unitLabel: 'post', unitPrice: 350, minUnits: 4, minUnitsLabel: '4 posts/month' },
    order: 5,
    active: true,
  },

  // MultiVerse > Branding
  makeSimple('branding', 'logo-design', 'Logo Design', 12000, ['3 Concepts', 'Unlimited Revisions on Selected', 'Final Files (SVG, PNG, PDF)'], '1-2 weeks'),
  makeSimple('branding', 'brand-identity-kit', 'Brand Identity Kit', 28000, ['Logo Suite', 'Color Palette', 'Typography', 'Brand Applications'], '2-3 weeks'),
  makeSimple('branding', 'brand-guidelines', 'Brand Guidelines', 10000, ['Usage Rules', 'Do & Don’t', 'Brand Voice'], '1 week'),
  makeSimple('branding', 'stationery', 'Business Card & Stationery', 8000, ['Business Card', 'Letterhead', 'Email Signature'], '1 week'),

  // MultiVerse > Design
  makeSimple('design', 'social-templates', 'Social Media Templates', 6000, ['5 Editable Templates', 'Brand-matched Style'], '3-5 days'),
  makeSimple('design', 'presentation-deck', 'Presentation Deck', 9000, ['Custom Slide Design', 'Icons & Charts', 'Editable Source'], '1 week'),
  makeSimple('design', 'packaging-design', 'Packaging Design', 15000, ['Concept', 'Print-ready Files', 'Mockups'], '1-2 weeks'),
  makeSimple('design', 'print-design', 'Print Design', 7000, ['Flyers / Brochures', 'Print-ready Files'], '3-5 days'),

  // MultiVerse > Automation
  makeSimple('automation', 'whatsapp-automation', 'WhatsApp Automation', 15000, ['Automated Replies', 'Order/Enquiry Flows', 'Broadcast Setup'], '1-2 weeks'),
  makeSimple('automation', 'workflow-automation', 'Workflow Automation', 18000, ['Process Mapping', 'Tool Integrations', 'Automated Triggers'], '2 weeks'),
  makeSimple('automation', 'crm-setup', 'CRM Setup', 20000, ['CRM Configuration', 'Pipeline Setup', 'Team Training'], '2 weeks'),
  makeSimple('automation', 'chatbot', 'Chatbot', 22000, ['Conversation Design', 'Integration', 'Testing'], '2-3 weeks'),

  // MultiVerse > Custom
  makeSimple('custom', 'custom-project', 'Custom Project', 15000, ['Discovery Call', 'Tailored Scope', 'Dedicated Timeline'], 'Varies'),
];

export const seedServices: Service[] = rawSeedServices.map(assignGroupOrder());

/** Assigns a stable display order within each category/business-type group, in authored (array) sequence. */
function assignGroupOrder(): (service: Service, index: number, all: Service[]) => Service {
  const counters = new Map<string, number>();
  return (service) => {
    const key = `${service.categoryId}::${service.businessTypeId ?? ''}`;
    const next = (counters.get(key) ?? 0) + 1;
    counters.set(key, next);
    return { ...service, order: next };
  };
}

function makeUniverse(
  suffix: string,
  name: string,
  price: number,
  includes: string[],
  delivery: string,
  upgrades: UpgradeOption[],
): Service {
  return {
    id: `universe-${suffix}`,
    divisionId: 'universe',
    categoryId: 'universe-catalog',
    name,
    startingPrice: price,
    priceType: 'starting',
    deliveryTime: delivery,
    includes,
    optionalUpgrades: upgrades,
    annualCharges: [],
    order: 0,
    active: true,
  };
}

function makeWebsite(suffix: string, name: string, price: number, includes: string[], delivery: string): Service {
  return {
    id: `website-${suffix}`,
    divisionId: 'multiverse',
    categoryId: 'websites',
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
    order: 0,
    active: true,
  };
}

function makeSimple(categoryId: string, suffix: string, name: string, price: number, includes: string[], delivery: string): Service {
  return {
    id: `${categoryId}-${suffix}`,
    divisionId: 'multiverse',
    categoryId,
    name,
    startingPrice: price,
    priceType: 'starting',
    deliveryTime: delivery,
    includes,
    optionalUpgrades: [],
    annualCharges: [],
    order: 0,
    active: true,
  };
}

export const seedCompanySettings: CompanySettings = {
  name: 'Kode31',
  logoUrl: '',
  gstNumber: '',
  bankDetails: {
    accountName: 'Kode31',
    accountNumber: '',
    ifsc: '',
    bankName: '',
  },
  footerText: 'Thank you for choosing Kode31. This quotation is generated digitally and does not require a signature.',
  paymentTermsDefault: '50% advance to begin work, balance on delivery.',
  validityDaysDefault: 15,
  address: '',
  phone: '',
  email: '',
  website: '',
  pdfTheme: {
    primaryColor: '#0b0b12',
    accentColor: '#7c5cfc',
  },
};
