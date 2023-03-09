import type { ComponentType } from 'react';

type AlgoliaHighlight = {
  value: string;
};

export type AlgoliaItemHierarchy<T> = {
  lvl0?: T | null;
  lvl1?: T | null;
  lvl2?: T | null;
  lvl3?: T | null;
  lvl4?: T | null;
  lvl5?: T | null;
  lvl6?: T | null;
};

export type AlgoliaItemType = {
  url: string;
  objectID: string;
  anchor: string | null;
  content: string | null;
  hierarchy: AlgoliaItemHierarchy<string>;
  _highlightResult: {
    content: AlgoliaHighlight | null;
    hierarchy: AlgoliaItemHierarchy<AlgoliaHighlight>;
  };
};

export type ExpoItemType = {
  label: string;
  url: string;
  Icon?: ComponentType<any>;
};

export type RNDirectoryItemType = {
  npmPkg: string;
  githubUrl: string;
  npm: {
    downloads: number;
  };
  github: {
    stats: {
      stars: number;
    };
  };
};
