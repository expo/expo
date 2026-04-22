import type { ImmutableRequest } from './ImmutableRequest';
export type MetadataValue = string | number | boolean;
export type MetadataValueArray = MetadataValue[];
export type MetadataGoogleBot = string | {
    index?: boolean;
    follow?: boolean;
    noimageindex?: boolean;
    'max-video-preview'?: number;
    'max-image-preview'?: 'none' | 'standard' | 'large';
    'max-snippet'?: number;
};
export type MetadataRobots = string | {
    index?: boolean;
    follow?: boolean;
    noarchive?: boolean;
    nosnippet?: boolean;
    noimageindex?: boolean;
    nocache?: boolean;
    notranslate?: boolean;
    unavailableAfter?: string;
    googleBot?: MetadataGoogleBot;
    [key: string]: MetadataValue | MetadataGoogleBot | undefined;
};
export type MetadataAlternates = {
    canonical?: string;
    languages?: Record<string, string>;
    media?: Record<string, string>;
    types?: Record<string, string>;
};
export type MetadataImage = string | {
    url: string;
    alt?: string;
    width?: number;
    height?: number;
    type?: string;
    secureUrl?: string;
};
export type MetadataVideo = string | {
    url: string;
    secureUrl?: string;
    type?: string;
    width?: number;
    height?: number;
};
export type MetadataAudio = string | {
    url: string;
    secureUrl?: string;
    type?: string;
};
export type MetadataOpenGraph = {
    title?: string;
    description?: string;
    url?: string;
    siteName?: string;
    locale?: string;
    type?: string;
    images?: MetadataImage | MetadataImage[];
    videos?: MetadataVideo | MetadataVideo[];
    audio?: MetadataAudio | MetadataAudio[];
    emails?: string[];
    phoneNumbers?: string[];
    faxNumbers?: string[];
    alternateLocale?: string[];
    countryName?: string;
    determiner?: 'a' | 'an' | 'the' | 'auto' | '';
    ttl?: number;
    publishedTime?: string;
    modifiedTime?: string;
    expirationTime?: string;
    section?: string;
    tags?: string[];
    authors?: string[];
};
export type MetadataTwitterImage = string | {
    url: string;
    alt?: string;
};
export type MetadataTwitterPlayer = {
    url: string;
    width?: number;
    height?: number;
    stream?: string;
};
export type MetadataTwitterApp = {
    name?: string;
    id?: {
        iphone?: string;
        ipad?: string;
        googleplay?: string;
    };
    url?: {
        iphone?: string;
        ipad?: string;
        googleplay?: string;
    };
};
export type MetadataTwitter = {
    card?: 'summary' | 'summary_large_image' | 'player' | 'app';
    title?: string;
    description?: string;
    site?: string;
    siteId?: string;
    creator?: string;
    creatorId?: string;
    images?: MetadataTwitterImage | MetadataTwitterImage[];
    players?: MetadataTwitterPlayer | MetadataTwitterPlayer[];
    app?: MetadataTwitterApp;
};
export type MetadataIconDescriptor = string | {
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
export type MetadataAuthor = {
    name?: string;
    url?: string;
};
export type MetadataFormatDetection = {
    telephone?: boolean;
    date?: boolean;
    address?: boolean;
    email?: boolean;
    url?: boolean;
};
export type MetadataVerification = {
    google?: string | string[];
    yahoo?: string | string[];
    yandex?: string | string[];
    other?: Record<string, string | string[]>;
};
export type MetadataAppleWebApp = {
    capable?: boolean;
    title?: string;
    statusBarStyle?: 'default' | 'black' | 'black-translucent';
    startupImage?: string | {
        url: string;
        media?: string;
    } | Array<string | {
        url: string;
        media?: string;
    }>;
};
export type MetadataItunes = {
    appId: string;
    affiliateData?: string;
    appArgument?: string;
};
export type MetadataFacebook = {
    appId?: string;
    admins?: string | string[];
};
export type MetadataPinterest = {
    richPin?: boolean;
};
export type MetadataAppLinks = {
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
        shouldFallback?: boolean;
    };
};
export type Metadata = {
    title?: string;
    description?: string;
    applicationName?: string;
    keywords?: string | string[];
    generator?: string;
    referrer?: 'no-referrer' | 'no-referrer-when-downgrade' | 'origin' | 'origin-when-cross-origin' | 'same-origin' | 'strict-origin' | 'strict-origin-when-cross-origin' | 'unsafe-url';
    authors?: MetadataAuthor | MetadataAuthor[];
    creator?: string;
    publisher?: string;
    robots?: MetadataRobots;
    alternates?: MetadataAlternates;
    openGraph?: MetadataOpenGraph;
    twitter?: MetadataTwitter;
    icons?: MetadataIcons;
    formatDetection?: MetadataFormatDetection;
    verification?: MetadataVerification;
    appleWebApp?: MetadataAppleWebApp;
    itunes?: MetadataItunes;
    appLinks?: MetadataAppLinks;
    archives?: string[];
    assets?: string[];
    bookmarks?: string[];
    category?: string;
    facebook?: MetadataFacebook;
    pinterest?: MetadataPinterest;
    manifest?: string;
    other?: Record<string, MetadataValue | MetadataValueArray | null | undefined>;
};
export type GenerateMetadataFunction = (request: ImmutableRequest | undefined, params: Record<string, string | string[]>) => Metadata | null | undefined | Promise<Metadata | null | undefined>;
