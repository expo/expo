import type {
  Metadata,
  MetadataIconDescriptor,
  MetadataImage,
  MetadataValue,
  MetadataValueArray,
} from 'expo-server';

type TitleTag = {
  tagName: 'title';
  content: string;
};

type MetaTag = {
  tagName: 'meta';
  attributes: Record<string, string>;
  content?: string;
};

type LinkTag = {
  tagName: 'link';
  attributes: Record<string, string>;
};

export type MetadataTag = TitleTag | MetaTag | LinkTag;

export function isTitleTag(tag: MetadataTag): tag is TitleTag {
  return tag.tagName === 'title';
}

export function isMetaTag(tag: MetadataTag): tag is MetaTag {
  return tag.tagName === 'meta';
}

export function isLinkTag(tag: MetadataTag): tag is LinkTag {
  return tag.tagName === 'link';
}

type ArrayElement<T> = T extends readonly (infer U)[] ? U : T;

export type MetadataAuthor = ArrayElement<NonNullable<Metadata['authors']>>;
export type MetadataAudio = ArrayElement<NonNullable<NonNullable<Metadata['openGraph']>['audio']>>;
export type MetadataVideo = ArrayElement<NonNullable<NonNullable<Metadata['openGraph']>['videos']>>;
export type MetadataTwitterImage = ArrayElement<
  NonNullable<NonNullable<Metadata['twitter']>['images']>
>;
export type MetadataTwitterPlayer = ArrayElement<
  NonNullable<NonNullable<Metadata['twitter']>['players']>
>;
export type MetadataTwitterApp = NonNullable<NonNullable<Metadata['twitter']>['app']>;
export type ResolvedAuthor = { name?: string; url?: string };

export type ResolvedAlternates = {
  canonical?: string;
  languages: { href: string; hrefLang: string }[];
  media: { href: string; media: string }[];
  types: { href: string; type: string }[];
};

export type ResolvedOpenGraphImage = {
  url: string;
  alt?: string;
  width?: string;
  height?: string;
  type?: string;
  secureUrl?: string;
};

export type ResolvedOpenGraphVideo = {
  url: string;
  secureUrl?: string;
  type?: string;
  width?: string;
  height?: string;
};

export type ResolvedOpenGraphAudio = {
  url: string;
  secureUrl?: string;
  type?: string;
};

export type ResolvedOpenGraph = {
  basic: { property: string; content: string }[];
  images: ResolvedOpenGraphImage[];
  videos: ResolvedOpenGraphVideo[];
  audio: ResolvedOpenGraphAudio[];
  article: { property: string; content: string }[];
};

export type ResolvedTwitterImage = {
  url: string;
  alt?: string;
};

export type ResolvedTwitterPlayer = {
  url: string;
  width?: string;
  height?: string;
  stream?: string;
};

export type ResolvedTwitterAppEntry = {
  platform: 'iphone' | 'ipad' | 'googleplay';
  name?: string;
  id?: string;
  url?: string;
};

export type ResolvedTwitter = {
  basic: { name: string; content: string }[];
  images: ResolvedTwitterImage[];
  players: ResolvedTwitterPlayer[];
  app: ResolvedTwitterAppEntry[];
};

export type ResolvedIcon = {
  rel: string;
  href: string;
  type?: string;
  sizes?: string;
  media?: string;
};

export type ResolvedIcons = {
  icon: ResolvedIcon[];
  shortcut: ResolvedIcon[];
  apple: ResolvedIcon[];
  other: ResolvedIcon[];
};

export type ResolvedVerification = {
  google: string[];
  yahoo: string[];
  yandex: string[];
  other: { name: string; content: string }[];
};

export type ResolvedAppleWebApp = {
  capable: 'yes';
  title?: string;
  statusBarStyle?: string;
  startupImages: { href: string; media?: string }[];
};

export type ResolvedFacebook = {
  appId?: string;
  admins: string[];
};

export type ResolvedAppLinks = {
  ios?: {
    url?: string;
    appStoreId?: string;
    appName?: string;
  };
  android?: {
    url?: string;
    package?: string;
    appName?: string;
  };
  web?: {
    url?: string;
    shouldFallback?: 'true' | 'false';
  };
};

export type ResolvedMetadata = {
  title?: string;
  description?: string;
  applicationName?: string;
  keywords?: string;
  generator?: string;
  referrer?: string;
  authors: ResolvedAuthor[];
  creator?: string;
  publisher?: string;
  category?: string;
  robots?: string;
  googleBot?: string;
  alternates?: ResolvedAlternates;
  openGraph?: ResolvedOpenGraph;
  twitter?: ResolvedTwitter;
  icons?: ResolvedIcons;
  formatDetection?: string;
  verification?: ResolvedVerification;
  appleWebApp?: ResolvedAppleWebApp;
  itunes?: string;
  facebook?: ResolvedFacebook;
  pinterest?: 'true' | 'false';
  appLinks?: ResolvedAppLinks;
  archives: string[];
  assets: string[];
  bookmarks: string[];
  manifest?: string;
  other: { name: string; content: string }[];
};

export type { Metadata, MetadataIconDescriptor, MetadataImage, MetadataValue, MetadataValueArray };
