import React from 'react';

export type MetroJsonModule = {
  dependencies: string[];
  getSource: string;
  path: string;
  size: number;
  output: {
    type: 'js/script/virtual' | string;
    data: {
      code: string;
      lineCount: number;
      // We convert this ahead of time.
      map: string;
    };
  }[];
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

// export function useFetchedServerData(): ExpoServerResponse | null {
//   const [data, setData] = React.useState<any>(null);
//   const [data, setData] = React.useState<any>(null);

//   React.useEffect(() => {
//     fetch(new URL(url, origin), {
//       // Cross-origin request...
//       // mode: 'no-cors',
//     })
//       .then((response) => {
//         if (!response.ok) {
//           throw new Error(
//             'Network response was not ok: ' + response.status + ' ' + response.statusText
//           );
//         }
//         return response.json();
//       })
//       .then((data) => setData(data));
//   }, []);

//   return data;
// }

export function CliDataProvider({ children }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
