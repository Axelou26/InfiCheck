import { createContext, useContext, useMemo, type ReactNode } from 'react';

type ConsentContextValue = {
  /** Réaffiche l'écran des conditions d'usage depuis n'importe quel écran. */
  reviewTerms: () => void;
};

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function ConsentProvider({
  onReviewTerms,
  children,
}: {
  onReviewTerms: () => void;
  children: ReactNode;
}) {
  const value = useMemo(() => ({ reviewTerms: onReviewTerms }), [onReviewTerms]);
  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
}

export function useConsent() {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsent must be used within ConsentProvider');
  }
  return ctx;
}
