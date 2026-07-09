import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuoteStore } from '@/store/quoteStore';
import { useDivisions } from '@/hooks/useCatalog';
import { Card } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { useAdminSeed } from '@/hooks/useAdminSeed';
import { Button } from '@/components/ui/Button';

export default function Home() {
  const navigate = useNavigate();
  const { appUser } = useAuth();
  const { divisions, loading } = useDivisions();
  const setDivision = useQuoteStore((s) => s.setDivision);
  const resetQuote = useQuoteStore((s) => s.resetQuote);
  const { seed, seeding } = useAdminSeed();

  const firstName = appUser?.name?.split(' ')[0];

  const handleSelect = (division: (typeof divisions)[number]) => {
    resetQuote();
    setDivision(division);
    navigate('/customer');
  };

  return (
    <div className="animate-fade-up">
      <div className="mb-10">
        <p className="text-sm text-base-400">
          {firstName ? `Welcome back, ${firstName}` : 'Welcome'}
        </p>
        <h1 className="mt-1 text-3xl font-semibold text-base-50 sm:text-4xl">Let's build a quote</h1>
        <p className="mt-2 max-w-md text-base-400">Choose a division to begin. Everything updates live as you go.</p>
      </div>

      {loading ? (
        <Spinner className="py-16" />
      ) : divisions.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="Catalog is empty"
          description="Load the Kode31 starter catalog to get Universe and MultiVerse services set up in one click."
          action={
            appUser?.role === 'admin' ? (
              <Button loading={seeding} onClick={() => void seed()}>
                Load Starter Catalog
              </Button>
            ) : (
              <p className="text-xs text-base-500">Ask an admin to load the starter catalog.</p>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          {divisions.map((division, i) => (
            <Card
              key={division.id}
              interactive
              onClick={() => handleSelect(division)}
              className="animate-fade-up p-8 sm:p-10"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div
                className="mb-6 flex size-16 items-center justify-center rounded-2xl text-3xl"
                style={{ background: `linear-gradient(135deg, ${division.colorFrom}33, ${division.colorTo}22)` }}
              >
                {division.icon}
              </div>
              <h2 className="text-2xl font-semibold text-base-50">{division.name}</h2>
              <p className="mt-1.5 text-base-400">{division.tagline}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent-300">
                Enter {division.name}
                <svg viewBox="0 0 24 24" className="size-4 fill-none stroke-current stroke-2">
                  <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
