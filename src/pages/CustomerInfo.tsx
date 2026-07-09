import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuoteStore } from '@/store/quoteStore';
import { PageHeader } from '@/components/layout/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function CustomerInfo() {
  const navigate = useNavigate();
  const division = useQuoteStore((s) => s.division);
  const customer = useQuoteStore((s) => s.customer);
  const setCustomer = useQuoteStore((s) => s.setCustomer);

  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [company, setCompany] = useState(customer?.company ?? '');

  if (!division) {
    navigate('/', { replace: true });
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setCustomer({ name: name.trim(), phone: phone.trim(), company: company.trim() || undefined });
    navigate(division.id === 'universe' ? '/universe' : '/multiverse');
  };

  return (
    <div className="mx-auto max-w-md animate-fade-up">
      <PageHeader title="Customer Details" subtitle={`Starting a ${division.name} quote`} onBack />

      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
        <Input
          label="Customer Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Aditi Sharma"
          required
          autoFocus
        />
        <Input
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. 98765 43210"
          required
        />
        <Input
          label="Company (optional)"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="e.g. Studio Nine"
        />

        <Button type="submit" size="lg" className="mt-4 w-full">
          Next →
        </Button>
      </form>
    </div>
  );
}
