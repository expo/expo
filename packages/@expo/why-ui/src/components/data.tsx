import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
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
      profiling: {
        start: number;
        end: number;
        pid: number;
        duration: number;
      };
    };
  }[];

  // Added later
  id?: string;
  absolutePath: string;
  isEntry: boolean;
  isNodeModule: boolean;
  nodeModuleName: string;
};

export type JsonGraph = [
  string,
  MetroJsonModule[],
  {
    transformOptions: any;
    entryPoints: string[];
    dependencies: MetroJsonModule[];
  },
  any,
];

export type ExpoServerResponse = {
  version: 1;
  graphs: JsonGraph[];
};

const origin = null; //'http://localhost:8081';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
  },
});

export function useFetchedServerData() {
  const url = '/fixture.json';
  // const url = '/_expo/last-metro-stats';
  return useQuery<ExpoServerResponse>({
    queryKey: ['graphs'],
    queryFn: async () => {
      return fetch(origin ? new URL(url, origin) : url, {
        // Cross-origin request...
        // mode: 'no-cors',
      }).then((response) => response.json());
    },
  });
}

export function CliDataProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
