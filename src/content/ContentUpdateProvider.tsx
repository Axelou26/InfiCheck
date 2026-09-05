import { createContext, useContext, type ReactNode } from 'react';
import { useContentUpdate, type ContentUpdateState } from '../content/useContentUpdate';

const ContentUpdateContext = createContext<ContentUpdateState | null>(null);

export function ContentUpdateProvider({ children }: { children: ReactNode }) {
  const state = useContentUpdate({ autoCheck: true });
  return (
    <ContentUpdateContext.Provider value={state}>{children}</ContentUpdateContext.Provider>
  );
}

export function useContentUpdateContext(): ContentUpdateState {
  const ctx = useContext(ContentUpdateContext);
  if (!ctx) {
    throw new Error('useContentUpdateContext must be used within ContentUpdateProvider');
  }
  return ctx;
}
