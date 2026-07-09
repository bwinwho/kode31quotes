import { useEffect, useState } from 'react';
import { listenQuotes, listenCompanySettings } from '@/lib/firestoreService';
import type { CompanySettings, Quote } from '@/types';

export function useQuotes() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    return listenQuotes((items) => {
      setQuotes(items);
      setLoading(false);
    });
  }, []);
  return { quotes, loading };
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    return listenCompanySettings((s) => {
      setSettings(s);
      setLoading(false);
    });
  }, []);
  return { settings, loading };
}
