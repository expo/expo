import type { IconProps } from '@expo/styleguide';
import type { ComponentType } from 'react';

export type AlgoliaItemType = {
  url: string;
  objectID: string;
  hierarchy: {
    lvl0?: string | null;
    lvl1?: string | null;
    lvl2?: string | null;
    lvl3?: string | null;
    lvl4?: string | null;
    lvl5?: string | null;
  };
};

export type ExpoItemType = {
  label: string;
  url: string;
  Icon?: ComponentType<IconProps>;
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
