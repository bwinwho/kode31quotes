import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, className, id, ...props },
  ref,
) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-medium text-base-200">{label}</span>}
      <input
        ref={ref}
        id={id}
        className={cn(
          'w-full h-[3.25rem] rounded-2xl border border-base-600 bg-base-900/60 px-4 text-base text-base-50 placeholder:text-base-400',
          'outline-none transition-all duration-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15',
          className,
        )}
        {...props}
      />
      {hint && <span className="mt-1.5 block text-xs text-base-400">{hint}</span>}
    </label>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, className, ...props },
  ref,
) {
  return (
    <label className="block">
      {label && <span className="mb-2 block text-sm font-medium text-base-200">{label}</span>}
      <textarea
        ref={ref}
        className={cn(
          'w-full min-h-24 rounded-2xl border border-base-600 bg-base-900/60 px-4 py-3 text-base text-base-50 placeholder:text-base-400',
          'outline-none transition-all duration-200 focus:border-accent-500 focus:ring-4 focus:ring-accent-500/15',
          className,
        )}
        {...props}
      />
    </label>
  );
});
