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

type QueryOptions = {
  pageSize: number;
};

type QueryOptionsContextProps = {
  queryOptions: QueryOptions;
  setQueryOptions: (options: QueryOptions) => void;
};

export const defaultQueryOptions: QueryOptions = {
  pageSize: 10,
};

const QueryOptionsContext = React.createContext<QueryOptionsContextProps | null>(null);
export const useQueryOptions = () => React.useContext(QueryOptionsContext);

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryOptions, setQueryOptions] = React.useState(defaultQueryOptions);

  return (
    <QueryClientProvider client={queryClient}>
      <QueryOptionsContext.Provider value={{ queryOptions, setQueryOptions }}>
        {children}
      </QueryOptionsContext.Provider>
    </QueryClientProvider>
  );
}
