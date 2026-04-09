import type { ImmutableRequest } from './ImmutableRequest';

export type MetadataValue = string | number | boolean;
export type MetadataValueArray = MetadataValue[];

export type MetadataRobots =
  | string
  | {
      index?: boolean;
      follow?: boolean;
      noarchive?: boolean;
      nosnippet?: boolean;
      noimageindex?: boolean;
      nocache?: boolean;
      notranslate?: boolean;
      unavailableAfter?: string;
      [key: string]: MetadataValue | undefined;
    };

export type MetadataAlternates = {
  canonical?: string;
  languages?: Record<string, string>;
  media?: Record<string, string>;
  types?: Record<string, string>;
};

export type MetadataImage = string | { url: string; alt?: string; width?: number; height?: number };

export type MetadataOpenGraph = {
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  locale?: string;
  type?: string;
  images?: MetadataImage | MetadataImage[];
};

export type MetadataTwitter = {
  card?: string;
  title?: string;
  description?: string;
  site?: string;
  creator?: string;
  images?: string | string[];
};

export type MetadataIconDescriptor =
  | string
  | {
      url: string;
      rel?: string;
      type?: string;
      sizes?: string;
      media?: string;
    };

export type MetadataIcons = {
  icon?: MetadataIconDescriptor | MetadataIconDescriptor[];
  shortcut?: MetadataIconDescriptor | MetadataIconDescriptor[];
  apple?: MetadataIconDescriptor | MetadataIconDescriptor[];
  other?: MetadataIconDescriptor | MetadataIconDescriptor[];
};

export type Metadata = {
  title?: string;
  description?: string;
  applicationName?: string;
  keywords?: string | string[];
  robots?: MetadataRobots;
  alternates?: MetadataAlternates;
  openGraph?: MetadataOpenGraph;
  twitter?: MetadataTwitter;
  icons?: MetadataIcons;
  other?: Record<string, MetadataValue | MetadataValueArray | null | undefined>;
};

export type GenerateMetadataFunction = (
  request: ImmutableRequest | undefined,
  params: Record<string, string | string[]>
) => Metadata | null | undefined | Promise<Metadata | null | undefined>;
