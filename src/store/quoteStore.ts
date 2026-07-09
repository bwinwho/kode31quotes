import { create } from 'zustand';
import type {
  Division,
  QuoteCustomer,
  QuoteLineItem,
  QuoteLineUpgrade,
  Service,
} from '@/types';

function lineTotal(item: QuoteLineItem): number {
  const upgradeTotal = item.selectedUpgrades.reduce((s, u) => s + u.price, 0);
  return item.unitPrice * item.quantity + upgradeTotal;
}

function unitPriceFor(service: Service, quantity: number): number {
  if (service.bundlePricing?.enabled && quantity >= service.bundlePricing.minUnits) {
    return service.bundlePricing.unitPrice;
  }
  return service.startingPrice;
}

interface QuoteState {
  division: Division | null;
  categoryPath: string[]; // breadcrumb of category/business-type names, for display + PDF grouping
  customer: QuoteCustomer | null;
  items: QuoteLineItem[];
  discount: { type: 'flat' | 'percent'; value: number };
  gstEnabled: boolean;
  gstRate: number;
  paymentTerms: string;
  validityDays: number;
  notes: string;

  setDivision: (d: Division | null) => void;
  setCategoryPath: (path: string[]) => void;
  setCustomer: (c: QuoteCustomer) => void;
  addService: (service: Service, categoryName: string, businessTypeName?: string) => void;
  removeItem: (serviceId: string) => void;
  hasItem: (serviceId: string) => boolean;
  setQuantity: (serviceId: string, quantity: number) => void;
  toggleUpgrade: (serviceId: string, upgrade: QuoteLineUpgrade) => void;
  toggleAnnualCharge: (serviceId: string, chargeId: string) => void;
  setDiscount: (type: 'flat' | 'percent', value: number) => void;
  setGst: (enabled: boolean, rate?: number) => void;
  setPaymentTerms: (v: string) => void;
  setValidityDays: (v: number) => void;
  setNotes: (v: string) => void;
  resetQuote: () => void;

  subtotal: () => number;
  annualTotal: () => number;
  discountAmount: () => number;
  gstAmount: () => number;
  grandTotal: () => number;
}

export const useQuoteStore = create<QuoteState>((set, get) => ({
  division: null,
  categoryPath: [],
  customer: null,
  items: [],
  discount: { type: 'flat', value: 0 },
  gstEnabled: false,
  gstRate: 18,
  paymentTerms: '',
  validityDays: 15,
  notes: '',

  setDivision: (d) => set({ division: d }),
  setCategoryPath: (path) => set({ categoryPath: path }),
  setCustomer: (c) => set({ customer: c }),

  addService: (service, categoryName, businessTypeName) =>
    set((state) => {
      if (state.items.some((i) => i.serviceId === service.id)) return state;
      const quantity = service.bundlePricing?.enabled ? service.bundlePricing.minUnits : 1;
      const unitPrice = unitPriceFor(service, quantity);
      const item: QuoteLineItem = {
        serviceId: service.id,
        name: service.name,
        categoryName,
        businessTypeName,
        priceType: service.priceType,
        unitPrice,
        quantity,
        lineTotal: 0,
        includes: service.includes,
        selectedUpgrades: [],
        annualCharges: service.annualCharges.map((c) => ({ id: c.id, name: c.name, price: c.price, included: c.defaultIncluded })),
        deliveryTime: service.deliveryTime,
        bundleLabel: service.bundlePricing?.enabled ? service.bundlePricing.minUnitsLabel : undefined,
      };
      item.lineTotal = lineTotal(item);
      return { items: [...state.items, item] };
    }),

  removeItem: (serviceId) => set((state) => ({ items: state.items.filter((i) => i.serviceId !== serviceId) })),

  hasItem: (serviceId) => get().items.some((i) => i.serviceId === serviceId),

  setQuantity: (serviceId, quantity) =>
    set((state) => ({
      items: state.items.map((i) => {
        if (i.serviceId !== serviceId) return i;
        const qty = Math.max(1, quantity);
        const updated = { ...i, quantity: qty };
        updated.lineTotal = lineTotal(updated);
        return updated;
      }),
    })),

  toggleUpgrade: (serviceId, upgrade) =>
    set((state) => ({
      items: state.items.map((i) => {
        if (i.serviceId !== serviceId) return i;
        const exists = i.selectedUpgrades.some((u) => u.id === upgrade.id);
        const selectedUpgrades = exists
          ? i.selectedUpgrades.filter((u) => u.id !== upgrade.id)
          : [...i.selectedUpgrades, upgrade];
        const updated = { ...i, selectedUpgrades };
        updated.lineTotal = lineTotal(updated);
        return updated;
      }),
    })),

  toggleAnnualCharge: (serviceId, chargeId) =>
    set((state) => ({
      items: state.items.map((i) => {
        if (i.serviceId !== serviceId) return i;
        return {
          ...i,
          annualCharges: i.annualCharges.map((c) => (c.id === chargeId ? { ...c, included: !c.included } : c)),
        };
      }),
    })),

  setDiscount: (type, value) => set({ discount: { type, value } }),
  setGst: (enabled, rate) => set((state) => ({ gstEnabled: enabled, gstRate: rate ?? state.gstRate })),
  setPaymentTerms: (v) => set({ paymentTerms: v }),
  setValidityDays: (v) => set({ validityDays: v }),
  setNotes: (v) => set({ notes: v }),

  resetQuote: () =>
    set({
      division: null,
      categoryPath: [],
      customer: null,
      items: [],
      discount: { type: 'flat', value: 0 },
      gstEnabled: false,
      notes: '',
    }),

  subtotal: () => get().items.reduce((s, i) => s + i.lineTotal, 0),
  annualTotal: () =>
    get().items.reduce((s, i) => s + i.annualCharges.filter((c) => c.included).reduce((cs, c) => cs + c.price, 0), 0),

  discountAmount: () => {
    const { discount } = get();
    const subtotal = get().subtotal();
    if (discount.type === 'percent') return Math.round((subtotal * discount.value) / 100);
    return Math.min(discount.value, subtotal);
  },

  gstAmount: () => {
    const state = get();
    if (!state.gstEnabled) return 0;
    const taxable = state.subtotal() - state.discountAmount() + state.annualTotal();
    return Math.round((taxable * state.gstRate) / 100);
  },

  grandTotal: () => {
    const state = get();
    return state.subtotal() - state.discountAmount() + state.annualTotal() + state.gstAmount();
  },
}));
