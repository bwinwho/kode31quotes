// Core domain types for Kode31 Quote Studio.
// Firestore is the source of truth for all pricing/catalog data — nothing here is a hardcoded price.

export type Role = 'admin' | 'member';

export interface AppUser {
  uid: string;
  name: string;
  email: string;
  role: Role;
  createdAt: number;
}

/** A top-level division, e.g. Universe (music/creative) or MultiVerse (digital/tech). Future divisions plug in here. */
export interface Division {
  id: string; // slug, e.g. 'universe'
  name: string;
  tagline: string;
  icon: string; // emoji or icon key
  colorFrom: string;
  colorTo: string;
  order: number;
  active: boolean;
}

/** A category within a division, e.g. MultiVerse > Apps, Websites, Social Media. Also used for Universe's flat service list ('services'). */
export interface Category {
  id: string;
  divisionId: string;
  name: string;
  slug: string;
  prompt?: string; // e.g. "What are we building?"
  icon: string;
  order: number;
  active: boolean;
  /** If true, selecting this category shows a business-type picker (e.g. Apps) before services/modules. */
  hasBusinessTypes?: boolean;
  /** If true, services under this category can have multiple modules selected at once (e.g. Cafe modules). */
  allowMultiSelect?: boolean;
}

/** A business/vertical type under a category that supports them (e.g. MultiVerse > Apps > Cafe, Gym). */
export interface BusinessType {
  id: string;
  categoryId: string; // usually 'apps'
  name: string;
  icon: string;
  order: number;
  active: boolean;
}

export type PriceType = 'fixed' | 'starting' | 'bundle';

export interface UpgradeOption {
  id: string;
  name: string;
  price: number;
}

export interface AnnualCharge {
  id: string;
  name: string;
  price: number;
  /** whether this annual charge is pre-checked by default when the service is added */
  defaultIncluded: boolean;
}

export interface BundlePricing {
  enabled: boolean;
  unitLabel: string; // e.g. "post"
  unitPrice: number;
  minUnits: number;
  minUnitsLabel: string; // e.g. "4 posts/month"
}

/** A sellable service/module/module-line. Covers Universe services, MultiVerse app modules, websites, and social media items. */
export interface Service {
  id: string;
  divisionId: string;
  categoryId: string;
  businessTypeId?: string | null; // set when nested under a business type (e.g. Apps > Cafe)
  name: string;
  description?: string;
  startingPrice: number;
  priceType: PriceType;
  deliveryTime?: string;
  includes: string[];
  optionalUpgrades: UpgradeOption[];
  annualCharges: AnnualCharge[];
  bundlePricing?: BundlePricing | null;
  order: number;
  active: boolean;
}

export type QuoteStatus = 'Draft' | 'Sent' | 'Signed' | 'Accepted' | 'Rejected';

export interface QuoteLineUpgrade {
  id: string;
  name: string;
  price: number;
}

export interface QuoteLineAnnualCharge {
  id: string;
  name: string;
  price: number;
  included: boolean;
}

export interface QuoteLineItem {
  serviceId: string;
  name: string;
  categoryName: string;
  businessTypeName?: string;
  priceType: PriceType;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  includes: string[];
  selectedUpgrades: QuoteLineUpgrade[];
  annualCharges: QuoteLineAnnualCharge[];
  deliveryTime?: string;
  bundleLabel?: string;
}

export interface QuoteCustomer {
  name: string;
  phone: string;
  company?: string;
}

export interface QuoteDiscount {
  type: 'flat' | 'percent';
  value: number;
  amount: number;
}

export interface QuoteGst {
  enabled: boolean;
  rate: number;
  amount: number;
}

export interface Quote {
  id: string;
  quoteNumber: string;
  divisionId: string;
  divisionName: string;
  customer: QuoteCustomer;
  items: QuoteLineItem[];
  annualTotal: number;
  subtotal: number;
  discount: QuoteDiscount;
  gst: QuoteGst;
  total: number;
  status: QuoteStatus;
  paymentTerms: string;
  validityDays: number;
  notes?: string;
  createdBy: { uid: string; name: string };
  createdAt: number;
  updatedAt: number;
}

export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
}

export interface CompanySettings {
  name: string;
  logoUrl: string;
  gstNumber: string;
  bankDetails: BankDetails;
  footerText: string;
  paymentTermsDefault: string;
  validityDaysDefault: number;
  address: string;
  phone: string;
  email: string;
  website: string;
  pdfTheme: {
    primaryColor: string;
    accentColor: string;
  };
}
