import type { Dispatch, SetStateAction } from 'react';

import type { AlgoliaItemHierarchy, AlgoliaItemType } from './types';

export const getItemsAsync = async <T>(
  query: string,
  fetcher: (query: string, version?: string) => Promise<Response>,
  setter: Dispatch<SetStateAction<T[]>>,
  version?: string
) => {
  const { hits, libraries } = await fetcher(query, version).then(response => response.json());
  setter(hits || libraries || []);
};

const getAlgoliaFetchParams = (
  query: string,
  appId: string,
  apiKey: string,
  indexName: string,
  hits: number,
  additionalParams: object = {}
): [string, RequestInit] => [
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

export const getExpoDocsResults = (query: string, version?: string) => {
  return fetch(
    ...getAlgoliaFetchParams(query, 'QEX7PB7D46', '6652d26570e8628af4601e1d78ad456b', 'expo', 10, {
      facetFilters: [['version:none', `version:${version}`]],
    })
  );
};

export const getRNDocsResults = (query: string) => {
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

export const getHighlightHTML = (
  item: AlgoliaItemType,
  tag: keyof AlgoliaItemHierarchy<string>
) => ({
  dangerouslySetInnerHTML: {
    __html: item._highlightResult.hierarchy[`${tag}`]?.value || '',
  },
});

const trimContent = (content: string, length = 36) => {
  if (!content || !content.length) return '';

  const trimStart = Math.max(content.indexOf('<mark>') - length, 0);
  const trimEnd = Math.min(content.indexOf('</mark>') + length + 6, content.length);

  return `${trimStart !== 0 ? '…' : ''}${content.substring(trimStart, trimEnd).trim()}${
    trimEnd !== content.length ? '…' : ''
  }`;
};

export const getContentHighlightHTML = (item: AlgoliaItemType, skipDescription = false) =>
  skipDescription
    ? {}
    : {
        dangerouslySetInnerHTML: {
          __html: item._highlightResult.content?.value
            ? trimContent(item._highlightResult.content?.value)
            : trimContent(item._highlightResult.hierarchy.lvl1?.value || '', 82),
        },
      };

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

const ReferencePathChunks = ['/versions/', '/more/'] as const;

export const isReferencePath = (url: string) => {
  return ReferencePathChunks.some(pathChunk => url.includes(pathChunk));
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
  return EASPathChunks.some(pathChunk => url.includes(pathChunk));
};

const HomePathChunks = [
  '/get-started/',
  '/develop/',
  '/deploy/',
  '/faq/',
  '/core-concepts/',
  '/debugging/',
  '/config-plugins/',
] as const;

export const isHomePath = (url: string) => {
  return HomePathChunks.some(pathChunk => url.includes(pathChunk));
};

const LearnPathChunks = ['/tutorial', '/ui-programming/', '/additional-resources/'] as const;

export const isLearnPath = (url: string) => {
  return LearnPathChunks.some(pathChunk => url.includes(pathChunk));
};

export const isAppleDevice = () => {
  return /(Mac|iPhone|iPod|iPad)/i.test(
    navigator?.platform ?? navigator?.userAgentData?.platform ?? ''
  );
};

export const addHighlight = (content: string, query: string) => {
  const highlightStart = content.toLowerCase().indexOf(query.toLowerCase());

  if (highlightStart === -1) return content;

  const highlightEnd = highlightStart + query.length;
  return (
    content.substring(0, highlightStart) +
    '<mark>' +
    content.substring(highlightStart, highlightEnd) +
    '</mark>' +
    content.substring(highlightEnd)
  );
};
