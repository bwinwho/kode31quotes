import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS, SETTINGS_DOC_ID } from './collections';
import { stripUndefined } from './utils';
import {
  seedBusinessTypes,
  seedCategories,
  seedCompanySettings,
  seedDivisions,
  seedServices,
} from './seedData';
import type {
  AppUser,
  BusinessType,
  Category,
  CompanySettings,
  Division,
  Quote,
  QuoteStatus,
  Service,
} from '@/types';

// ---------- Divisions ----------
export function listenDivisions(cb: (items: Division[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.divisions), orderBy('order', 'asc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Division)));
}

// ---------- Categories ----------
export function listenCategories(divisionId: string, cb: (items: Category[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.categories), where('divisionId', '==', divisionId));
  return onSnapshot(q, (snap) => {
    const items = (snap.docs.map((d) => d.data() as Category)).sort((a, b) => a.order - b.order);
    cb(items);
  });
}

// ---------- Business Types ----------
export function listenBusinessTypes(categoryId: string, cb: (items: BusinessType[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.businessTypes), where('categoryId', '==', categoryId));
  return onSnapshot(q, (snap) => {
    const items = (snap.docs.map((d) => d.data() as BusinessType)).sort((a, b) => a.order - b.order);
    cb(items);
  });
}

// ---------- Services ----------
export function listenServices(cb: (items: Service[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.services));
  return onSnapshot(q, (snap) => {
    const items = (snap.docs.map((d) => d.data() as Service)).sort((a, b) => a.order - b.order);
    cb(items);
  });
}

export async function saveService(service: Service): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.services, service.id), stripUndefined(service));
}

export async function deleteService(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.services, id));
}

// ---------- Categories / Business types (admin CRUD) ----------
export async function saveCategory(category: Category): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.categories, category.id), stripUndefined(category));
}

export async function deleteCategory(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.categories, id));
}

export async function saveBusinessType(bt: BusinessType): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.businessTypes, bt.id), stripUndefined(bt));
}

export async function deleteBusinessType(id: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.businessTypes, id));
}

// ---------- Company settings ----------
export async function getCompanySettings(): Promise<CompanySettings | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID));
  return snap.exists() ? (snap.data() as CompanySettings) : null;
}

export function listenCompanySettings(cb: (settings: CompanySettings | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID), (snap) => {
    cb(snap.exists() ? (snap.data() as CompanySettings) : null);
  });
}

export async function saveCompanySettings(settings: CompanySettings): Promise<void> {
  await setDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID), stripUndefined(settings));
}

// ---------- Quotes ----------
export async function createQuote(quote: Quote): Promise<string> {
  await setDoc(doc(db, COLLECTIONS.quotes, quote.id), stripUndefined(quote));
  return quote.id;
}

export async function updateQuoteStatus(id: string, status: QuoteStatus): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.quotes, id), { status, updatedAt: Date.now() });
}

export function listenQuotes(cb: (items: Quote[]) => void): Unsubscribe {
  const q = query(collection(db, COLLECTIONS.quotes), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snap) => cb(snap.docs.map((d) => d.data() as Quote)));
}

export async function getQuoteById(id: string): Promise<Quote | null> {
  const snap = await getDoc(doc(db, COLLECTIONS.quotes, id));
  return snap.exists() ? (snap.data() as Quote) : null;
}

// ---------- Users ----------
export async function ensureUserDoc(uid: string, name: string, email: string): Promise<AppUser> {
  const ref = doc(db, COLLECTIONS.users, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return snap.data() as AppUser;
  const usersSnap = await getDocs(collection(db, COLLECTIONS.users));
  const role = usersSnap.empty ? 'admin' : 'member'; // first user in the workspace becomes admin
  const user: AppUser = { uid, name, email, role, createdAt: Date.now() };
  await setDoc(ref, user);
  return user;
}

export function listenUser(uid: string, cb: (user: AppUser | null) => void): Unsubscribe {
  return onSnapshot(doc(db, COLLECTIONS.users, uid), (snap) => {
    cb(snap.exists() ? (snap.data() as AppUser) : null);
  });
}

export function listenTeam(cb: (users: AppUser[]) => void): Unsubscribe {
  return onSnapshot(collection(db, COLLECTIONS.users), (snap) => cb(snap.docs.map((d) => d.data() as AppUser)));
}

export async function updateUserRole(uid: string, role: AppUser['role']): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.users, uid), { role });
}

// ---------- Seeding ----------
export async function isDatabaseSeeded(): Promise<boolean> {
  const snap = await getDocs(collection(db, COLLECTIONS.divisions));
  return !snap.empty;
}

export async function seedDatabase(): Promise<void> {
  const batch = writeBatch(db);
  for (const d of seedDivisions) batch.set(doc(db, COLLECTIONS.divisions, d.id), d);
  for (const c of seedCategories) batch.set(doc(db, COLLECTIONS.categories, c.id), c);
  for (const bt of seedBusinessTypes) batch.set(doc(db, COLLECTIONS.businessTypes, bt.id), bt);
  for (const s of seedServices) batch.set(doc(db, COLLECTIONS.services, s.id), s);
  batch.set(doc(db, COLLECTIONS.settings, SETTINGS_DOC_ID), seedCompanySettings);
  await batch.commit();
}

export async function addCustomEntity<T extends { id: string }>(
  collectionName: string,
  item: T,
): Promise<void> {
  await setDoc(doc(db, collectionName, item.id), stripUndefined(item));
}

export async function createDocWithAutoId(collectionName: string, data: Record<string, unknown>): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), data);
  return ref.id;
}
