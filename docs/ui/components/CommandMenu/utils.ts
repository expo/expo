import type { Dispatch, SetStateAction } from 'react';

export const getItems = async (
  query: string,
  fetcher: (query: string, version?: string) => Promise<any>,
  setter: Dispatch<SetStateAction<any[]>>,
  version?: string
) => {
  const data = await fetcher(query, version).then(response => response.json());
  setter(data?.hits || data?.libraries || []);
};

const getAlgoliaFetchParams = (
  query: string,
  appId: string,
  apiKey: string,
  indexName: string,
  hits: number,
  additionalParams: object = {}
): [string, any] => [
  `https://${appId}-dsn.algolia.net/1/indexes/${indexName}/query`,
  {
    method: 'POST',
    headers: {
      'X-Algolia-Application-Id': appId,
      'X-Algolia-API-Key': apiKey,
    },
    body: JSON.stringify({
      params: `query=${query}&hitsPerPage=${hits}`,
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
      ...additionalParams,
    }),
  },
];

export const getExpoResults = (query: string, version?: string) => {
  return fetch(
    ...getAlgoliaFetchParams(query, 'QEX7PB7D46', '6652d26570e8628af4601e1d78ad456b', 'expo', 10, {
      facetFilters: [['version:none', `version:${version}`]],
    })
  );
};

export const getDocsResults = (query: string) => {
  return fetch(
    ...getAlgoliaFetchParams(
      query,
      '8TDSE0OHGQ',
      'c9c791d9d5fd7f315d7f3859b32c1f3b',
      'react-native-v2',
      5,
      { facetFilters: [['version:current']] }
    )
  );
};

export const getDirectoryResults = (query: string) => {
  return fetch(`https://reactnative.directory/api/libraries?search=${encodeURI(query)}&limit=5`);
};

export const getHighlightHTML = (item: any, tag: string) => ({
  dangerouslySetInnerHTML: {
    __html: item._highlightResult.hierarchy[`${tag}`].value,
  },
});

export const processAlgoliaResults = (data: any[]) => {};

// note(simek): this code make sure that browser popup blocker
// do not prevent opening links via key press (when it fires windows.open)
export const openLink = (url: string, isExternal: boolean = false) => {
  const link = document.createElement('a');
  if (isExternal) {
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }
  link.href = url;
  link.click();
};

const EASPathChunks = [
  '/app-signing/',
  '/build/',
  '/build-reference/',
  '/development/',
  '/eas/',
  '/eas/metadata/',
  '/eas-update/',
  '/submit/',
] as const;

export const isEASPath = (url: string) => {
  for (const pathChunk of EASPathChunks) {
    if (url.includes(pathChunk)) {
      return true;
    }
  }
  return false;
};
