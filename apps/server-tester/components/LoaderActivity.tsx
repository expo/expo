import { Activity, createContext, type ReactNode, use } from 'react';

export const LoaderActivityMode = createContext<'visible' | 'hidden'>('visible');

export function LoaderActivity({ children }: { children: ReactNode }) {
  return <Activity mode={use(LoaderActivityMode)}>{children}</Activity>;
}
