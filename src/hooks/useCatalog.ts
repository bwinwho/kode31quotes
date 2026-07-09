import { useEffect, useState } from 'react';
import {
  listenBusinessTypes,
  listenCategories,
  listenDivisions,
  listenServices,
} from '@/lib/firestoreService';
import type { BusinessType, Category, Division, Service } from '@/types';

export function useDivisions() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    return listenDivisions((items) => {
      setDivisions(items);
      setLoading(false);
    });
  }, []);
  return { divisions, loading };
}

export function useCategories(divisionId: string | undefined) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!divisionId) {
      setCategories([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenCategories(divisionId, (items) => {
      setCategories(items);
      setLoading(false);
    });
  }, [divisionId]);
  return { categories, loading };
}

export function useBusinessTypes(categoryId: string | undefined) {
  const [businessTypes, setBusinessTypes] = useState<BusinessType[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!categoryId) {
      setBusinessTypes([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return listenBusinessTypes(categoryId, (items) => {
      setBusinessTypes(items);
      setLoading(false);
    });
  }, [categoryId]);
  return { businessTypes, loading };
}

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    return listenServices((items) => {
      setServices(items);
      setLoading(false);
    });
  }, []);
  return { services, loading };
}
