import * as React from 'react';
import { QueryClient, QueryClientProvider, setLogger } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      cacheTime: Infinity,
    },
  },
});

setLogger({
  log: console.log,
  warn: console.warn,
  error: () => {},
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
