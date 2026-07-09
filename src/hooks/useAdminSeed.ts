import { useState } from 'react';
import { seedDatabase } from '@/lib/firestoreService';

export function useAdminSeed() {
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState('');

  const seed = async () => {
    setSeeding(true);
    setError('');
    try {
      await seedDatabase();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load starter catalog.');
    } finally {
      setSeeding(false);
    }
  };

  return { seed, seeding, error };
}
