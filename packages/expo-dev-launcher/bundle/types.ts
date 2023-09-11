import { ReactNode } from 'react';

export type DevSession = {
  url: string;
  description: string;
  source: string;
};

declare module 'react-query/types/react/QueryClientProvider' {
  interface QueryClientProviderProps {
    children?: ReactNode;
  }
}
