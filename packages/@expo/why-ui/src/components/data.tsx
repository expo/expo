import React from 'react';

export type MetroJsonModule = {
  dependencies: string[];
  getSource: string;
  path: string;
  size: number;
  inverseDependencies: string[];
  output: {
    type: 'js/script/virtual' | string;
    data: {
      code: string;
      lineCount: number;
      // We convert this ahead of time.
      map: string;
    };
  }[];

  // Added later
  id?: string;
  absolutePath?: string;
  isEntry?: boolean;
  isNodeModule?: boolean;
};

export type JsonGraph = [string, MetroJsonModule[], { dependencies: MetroJsonModule[] }, any];

// export function getData() {
//   return fixture;
// }

export type ExpoServerResponse = {
  version: 1;
  graphs: JsonGraph[];
};

const origin = 'http://localhost:8081';

import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from '@tanstack/react-query';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  },
});

export function useFetchedServerData() {
  const url = '/_expo/last-metro-stats';
  return useQuery<ExpoServerResponse>({
    queryKey: ['graphs'],
    queryFn: async () => {
      return fetch(new URL(url, origin), {
        // Cross-origin request...
        // mode: 'no-cors',
      }).then((response) => response.json());
    },
  });
}

export function CliDataProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
