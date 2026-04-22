import type {
  Metadata,
  MetadataAuthor,
  MetadataAudio,
  MetadataIconDescriptor,
  MetadataImage,
  MetadataTwitterApp,
  MetadataTwitterImage,
  MetadataTwitterPlayer,
  MetadataValue,
  MetadataValueArray,
  MetadataVideo,
  ResolvedAlternates,
  ResolvedAppLinks,
  ResolvedAppleWebApp,
  ResolvedFacebook,
  ResolvedIcon,
  ResolvedIcons,
  ResolvedMetadata,
  ResolvedOpenGraph,
  ResolvedOpenGraphAudio,
  ResolvedOpenGraphImage,
  ResolvedOpenGraphVideo,
  ResolvedTwitter,
  ResolvedTwitterAppEntry,
  ResolvedTwitterImage,
  ResolvedTwitterPlayer,
  ResolvedVerification,
} from './types';

export function resolveMetadata(metadata: Metadata): ResolvedMetadata {
  const resolvedRobots = resolveRobots(metadata.robots);

  return {
    ...resolveBasicMetadata(metadata),
    authors: resolveAuthors(metadata.authors),
    robots: resolvedRobots.robots,
    googleBot: resolvedRobots.googleBot,
    alternates: resolveAlternates(metadata.alternates),
    openGraph: resolveOpenGraph(metadata.openGraph),
    twitter: resolveTwitter(metadata.twitter),
    icons: resolveIcons(metadata.icons),
    formatDetection: resolveFormatDetection(metadata.formatDetection),
    verification: resolveVerification(metadata.verification),
    appleWebApp: resolveAppleWebApp(metadata.appleWebApp),
    itunes: resolveItunes(metadata.itunes),
    facebook: resolveFacebook(metadata.facebook),
    pinterest: resolvePinterest(metadata.pinterest),
    appLinks: resolveAppLinks(metadata.appLinks),
    archives: metadata.archives ?? [],
    assets: metadata.assets ?? [],
    bookmarks: metadata.bookmarks ?? [],
    manifest: metadata.manifest,
    other: resolveOther(metadata.other),
  };
}

export function resolveRobots(robots: Metadata['robots']): {
  robots?: string;
  googleBot?: string;
} {
  if (!robots) {
    return {};
  }

  return {
    robots: serializeRobotsValue(robots),
    googleBot:
      typeof robots === 'object'
        ? serializeRobotsValue(robots.googleBot as string | Record<string, unknown> | undefined)
        : undefined,
  };
}

export function resolveOpenGraph(openGraph: Metadata['openGraph']): ResolvedOpenGraph | undefined {
  if (!openGraph) return undefined;

  const basic: { property: string; content: string }[] = [];
  const images: ResolvedOpenGraphImage[] = [];
  const videos: ResolvedOpenGraphVideo[] = [];
  const audio: ResolvedOpenGraphAudio[] = [];
  const article: { property: string; content: string }[] = [];

  pushResolvedProperty(basic, 'og:title', openGraph.title);
  pushResolvedProperty(basic, 'og:description', openGraph.description);
  pushResolvedProperty(basic, 'og:url', openGraph.url);
  pushResolvedProperty(basic, 'og:site_name', openGraph.siteName);
  pushResolvedProperty(basic, 'og:locale', openGraph.locale);
  pushResolvedProperty(basic, 'og:type', openGraph.type);
  if (openGraph.determiner) {
    pushResolvedProperty(basic, 'og:determiner', openGraph.determiner);
  }
  pushResolvedProperty(basic, 'og:country_name', openGraph.countryName);
  if (openGraph.ttl != null) {
    pushResolvedProperty(basic, 'og:ttl', String(openGraph.ttl));
  }

  for (const locale of openGraph.alternateLocale ?? []) {
    pushResolvedProperty(basic, 'og:locale:alternate', locale);
  }
  for (const email of openGraph.emails ?? []) {
    pushResolvedProperty(basic, 'og:email', email);
  }
  for (const phoneNumber of openGraph.phoneNumbers ?? []) {
    pushResolvedProperty(basic, 'og:phone_number', phoneNumber);
  }
  for (const faxNumber of openGraph.faxNumbers ?? []) {
    pushResolvedProperty(basic, 'og:fax_number', faxNumber);
  }

  for (const image of normalizeMetadataImages(openGraph.images)) {
    if (typeof image === 'string') {
      images.push({ url: image });
      continue;
    }

    images.push({
      url: image.url,
      alt: image.alt,
      width: image.width != null ? String(image.width) : undefined,
      height: image.height != null ? String(image.height) : undefined,
      type: image.type,
      secureUrl: image.secureUrl,
    });
  }

  for (const video of normalizeArray<MetadataVideo>(openGraph.videos)) {
    if (typeof video === 'string') {
      videos.push({ url: video });
      continue;
    }

    videos.push({
      url: video.url,
      secureUrl: video.secureUrl,
      type: video.type,
      width: video.width != null ? String(video.width) : undefined,
      height: video.height != null ? String(video.height) : undefined,
    });
  }

  for (const audioItem of normalizeArray<MetadataAudio>(openGraph.audio)) {
    if (typeof audioItem === 'string') {
      audio.push({ url: audioItem });
      continue;
    }

    audio.push({
      url: audioItem.url,
      secureUrl: audioItem.secureUrl,
      type: audioItem.type,
    });
  }

  if (openGraph.type === 'article') {
    pushResolvedProperty(article, 'article:published_time', openGraph.publishedTime);
    pushResolvedProperty(article, 'article:modified_time', openGraph.modifiedTime);
    pushResolvedProperty(article, 'article:expiration_time', openGraph.expirationTime);
    pushResolvedProperty(article, 'article:section', openGraph.section);

    for (const tag of openGraph.tags ?? []) {
      pushResolvedProperty(article, 'article:tag', tag);
    }
    for (const author of openGraph.authors ?? []) {
      pushResolvedProperty(article, 'article:author', author);
    }
  }

  return {
    basic,
    images,
    videos,
    audio,
    article,
  };
}

export function resolveTwitter(twitter: Metadata['twitter']): ResolvedTwitter | undefined {
  if (!twitter) return undefined;

  const basic: { name: string; content: string }[] = [];
  const images: ResolvedTwitterImage[] = [];
  const players: ResolvedTwitterPlayer[] = [];
  const app: ResolvedTwitterAppEntry[] = [];

  pushResolvedName(basic, 'twitter:card', twitter.card);
  pushResolvedName(basic, 'twitter:title', twitter.title);
  pushResolvedName(basic, 'twitter:description', twitter.description);
  pushResolvedName(basic, 'twitter:site', twitter.site);
  pushResolvedName(basic, 'twitter:site:id', twitter.siteId);
  pushResolvedName(basic, 'twitter:creator', twitter.creator);
  pushResolvedName(basic, 'twitter:creator:id', twitter.creatorId);

  for (const image of normalizeArray<MetadataTwitterImage>(twitter.images)) {
    if (typeof image === 'string') {
      images.push({ url: image });
      continue;
    }

    images.push({
      url: image.url,
      alt: image.alt,
    });
  }

  for (const player of normalizeArray<MetadataTwitterPlayer>(twitter.players)) {
    players.push({
      url: player.url,
      width: player.width != null ? String(player.width) : undefined,
      height: player.height != null ? String(player.height) : undefined,
      stream: player.stream,
    });
  }

  app.push(...resolveTwitterApp(twitter.app));

  return {
    basic,
    images,
    players,
    app,
  };
}

export function resolveVerification(
  verification: Metadata['verification']
): ResolvedVerification | undefined {
  if (!verification) return undefined;

  const resolved: ResolvedVerification = {
    google: normalizeArray(verification.google),
    yahoo: normalizeArray(verification.yahoo),
    yandex: normalizeArray(verification.yandex),
    other: [],
  };

  if (verification.other) {
    for (const [name, value] of Object.entries(verification.other)) {
      for (const content of normalizeArray(value)) {
        resolved.other.push({ name, content: String(content) });
      }
    }
  }

  return resolved;
}

export function resolveAppleWebApp(
  appleWebApp: Metadata['appleWebApp']
): ResolvedAppleWebApp | undefined {
  if (!appleWebApp) return undefined;

  const startupImages: { href: string; media?: string }[] = [];

  for (const image of normalizeArray(appleWebApp.startupImage)) {
    if (typeof image === 'string') {
      startupImages.push({ href: image });
      continue;
    }

    if (image.url) {
      startupImages.push({ href: image.url, media: image.media });
    }
  }

  return {
    capable: 'yes',
    title: appleWebApp.title,
    statusBarStyle: appleWebApp.statusBarStyle,
    startupImages,
  };
}

export function resolveOther(other: Metadata['other']): { name: string; content: string }[] {
  const resolved: { name: string; content: string }[] = [];
  if (!other) return resolved;

  for (const [name, value] of Object.entries(other)) {
    for (const content of normalizeOtherValue(value)) {
      resolved.push({ name, content });
    }
  }

  return resolved;
}

function resolveBasicMetadata(
  metadata: Metadata
): Pick<
  ResolvedMetadata,
  | 'title'
  | 'description'
  | 'applicationName'
  | 'keywords'
  | 'generator'
  | 'referrer'
  | 'creator'
  | 'publisher'
  | 'category'
> {
  return {
    title: metadata.title,
    description: metadata.description,
    applicationName: metadata.applicationName,
    keywords: Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords,
    generator: metadata.generator,
    referrer: metadata.referrer,
    creator: metadata.creator,
    publisher: metadata.publisher,
    category: metadata.category,
  };
}

function resolveAuthors(authors: Metadata['authors']): { name?: string; url?: string }[] {
  return normalizeArray<MetadataAuthor>(authors).map((author) => ({
    name: author.name,
    url: author.url,
  }));
}

function resolveAlternates(alternates: Metadata['alternates']): ResolvedAlternates | undefined {
  if (!alternates) return undefined;

  const resolved: ResolvedAlternates = {
    canonical: alternates.canonical,
    languages: [],
    media: [],
    types: [],
  };

  if (alternates.languages) {
    for (const [hrefLang, href] of Object.entries(alternates.languages)) {
      if (!href) continue;
      resolved.languages.push({ href, hrefLang });
    }
  }

  if (alternates.media) {
    for (const [media, href] of Object.entries(alternates.media)) {
      if (!href) continue;
      resolved.media.push({ href, media });
    }
  }

  if (alternates.types) {
    for (const [type, href] of Object.entries(alternates.types)) {
      if (!href) continue;
      resolved.types.push({ href, type });
    }
  }

  return resolved;
}

function resolveTwitterApp(app: MetadataTwitterApp | undefined): ResolvedTwitterAppEntry[] {
  if (!app) return [];

  const resolved: ResolvedTwitterAppEntry[] = [];

  for (const platform of ['iphone', 'ipad', 'googleplay'] as const) {
    resolved.push({
      platform,
      name: app.name,
      id: app.id?.[platform],
      url: app.url?.[platform],
    });
  }

  return resolved;
}

function resolveIcons(icons: Metadata['icons']): ResolvedIcons | undefined {
  if (!icons) return undefined;

  return {
    icon: resolveIconDescriptors('icon', icons.icon),
    shortcut: resolveIconDescriptors('shortcut icon', icons.shortcut),
    apple: resolveIconDescriptors('apple-touch-icon', icons.apple),
    other: resolveIconDescriptors('icon', icons.other),
  };
}

function resolveIconDescriptors(
  rel: string,
  descriptors: Metadata['icons'] extends infer T
    ? T extends null | undefined
      ? never
      : T[keyof T]
    : never
): ResolvedIcon[] {
  const resolved: ResolvedIcon[] = [];

  for (const descriptor of normalizeArray<MetadataIconDescriptor>(descriptors)) {
    const normalized = normalizeIconDescriptor(rel, descriptor);
    if (normalized) {
      resolved.push(normalized);
    }
  }

  return resolved;
}

function normalizeIconDescriptor(
  rel: string,
  descriptor: MetadataIconDescriptor
): ResolvedIcon | null {
  if (typeof descriptor === 'string') {
    return { rel, href: descriptor };
  }

  if (!descriptor.url) {
    return null;
  }

  return {
    rel: descriptor.rel ?? rel,
    href: descriptor.url,
    type: descriptor.type,
    sizes: descriptor.sizes,
    media: descriptor.media,
  };
}

function resolveFormatDetection(formatDetection: Metadata['formatDetection']): string | undefined {
  if (!formatDetection) return undefined;

  const parts: string[] = [];
  if (formatDetection.telephone != null) {
    parts.push(`telephone=${formatDetection.telephone ? 'yes' : 'no'}`);
  }
  if (formatDetection.date != null) {
    parts.push(`date=${formatDetection.date ? 'yes' : 'no'}`);
  }
  if (formatDetection.address != null) {
    parts.push(`address=${formatDetection.address ? 'yes' : 'no'}`);
  }
  if (formatDetection.email != null) {
    parts.push(`email=${formatDetection.email ? 'yes' : 'no'}`);
  }
  if (formatDetection.url != null) {
    parts.push(`url=${formatDetection.url ? 'yes' : 'no'}`);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join(', ');
}

function resolveItunes(itunes: Metadata['itunes']): string | undefined {
  if (!itunes) return undefined;

  const parts = [`app-id=${itunes.appId}`];
  if (itunes.affiliateData) {
    parts.push(`affiliate-data=${itunes.affiliateData}`);
  }
  if (itunes.appArgument) {
    parts.push(`app-argument=${itunes.appArgument}`);
  }

  return parts.join(', ');
}

function resolveFacebook(facebook: Metadata['facebook']): ResolvedFacebook | undefined {
  if (!facebook) return undefined;

  return {
    appId: facebook.appId,
    admins: normalizeArray(facebook.admins),
  };
}

function resolvePinterest(pinterest: Metadata['pinterest']): 'true' | 'false' | undefined {
  if (!pinterest || pinterest.richPin == null) return undefined;
  return pinterest.richPin ? 'true' : 'false';
}

function resolveAppLinks(appLinks: Metadata['appLinks']): ResolvedAppLinks | undefined {
  if (!appLinks) return undefined;

  const ios =
    appLinks.ios && (appLinks.ios.url || appLinks.ios.appStoreId || appLinks.ios.appName)
      ? {
          url: appLinks.ios.url,
          appStoreId: appLinks.ios.appStoreId,
          appName: appLinks.ios.appName,
        }
      : undefined;

  const android =
    appLinks.android &&
    (appLinks.android.url || appLinks.android.package || appLinks.android.appName)
      ? {
          url: appLinks.android.url,
          package: appLinks.android.package,
          appName: appLinks.android.appName,
        }
      : undefined;

  const web =
    appLinks.web && (appLinks.web.url || appLinks.web.shouldFallback != null)
      ? {
          url: appLinks.web.url,
          shouldFallback:
            appLinks.web.shouldFallback != null
              ? appLinks.web.shouldFallback
                ? ('true' as const)
                : ('false' as const)
              : undefined,
        }
      : undefined;

  return {
    ios,
    android,
    web,
  };
}

function serializeRobotsValue(
  robots: string | Record<string, unknown> | null | undefined
): string | undefined {
  if (!robots) return undefined;
  if (typeof robots === 'string') return robots;

  const values: string[] = [];

  for (const [key, value] of Object.entries(robots)) {
    if (key === 'googleBot' || value == null || typeof value === 'object') continue;
    if (typeof value === 'boolean') {
      values.push(value ? key : `no${key}`);
      continue;
    }

    values.push(`${key}:${String(value)}`);
  }

  if (values.length === 0) {
    return undefined;
  }

  return values.join(', ');
}

function normalizeArray<T>(items: T | T[] | undefined): T[] {
  if (!items) return [];
  return Array.isArray(items) ? items : [items];
}

function normalizeMetadataImages(
  images: MetadataImage | MetadataImage[] | undefined
): MetadataImage[] {
  return normalizeArray(images);
}

function normalizeOtherValue(
  value: MetadataValue | MetadataValueArray | null | undefined
): string[] {
  if (value == null) return [];
  return normalizeArray(value).map((entry) => String(entry));
}

function pushResolvedName(
  fields: { name: string; content: string }[],
  name: string,
  content: string | undefined
) {
  if (!content) return;
  fields.push({ name, content });
}

function pushResolvedProperty(
  fields: { property: string; content: string }[],
  property: string,
  content: string | undefined
) {
  if (!content) return;
  fields.push({ property, content });
}
