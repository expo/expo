import type {
  Metadata,
  MetadataIconDescriptor,
  MetadataImage,
  MetadataValue,
  MetadataValueArray,
} from 'expo-server';

type MetadataTag = {
  tagName: 'title' | 'meta' | 'link';
  attributes?: Record<string, string>;
  content?: string;
};

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeHtmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMetadataTag(tag: MetadataTag): string {
  const attributes = tag.attributes
    ? ' ' +
      Object.entries(tag.attributes)
        .filter(([, value]) => value != null && value !== '')
        .map(([key, value]) => `${key}="${escapeHtmlAttribute(value)}"`)
        .join(' ')
    : '';

  if (tag.tagName === 'title') {
    return `<title>${escapeHtmlText(tag.content ?? '')}</title>`;
  }

  return `<${tag.tagName}${attributes}>`;
}

function pushMetaContent(
  tags: MetadataTag[],
  name: 'name' | 'property',
  key: string,
  value: string | undefined
) {
  if (!value) return;
  tags.push({
    tagName: 'meta',
    attributes: {
      [name]: key,
      content: value,
    },
  });
}

function toCommaSeparatedValue(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  return Array.isArray(value) ? value.join(', ') : value;
}

function serializeRobotsValue(robots: Metadata['robots'] | undefined): string | undefined {
  if (!robots) return undefined;
  if (typeof robots === 'string') return robots;

  const values: string[] = [];
  for (const [key, value] of Object.entries(robots)) {
    if (value == null) continue;
    if (typeof value === 'boolean') {
      values.push(value ? key : `no${key}`);
    } else {
      values.push(`${key}:${String(value)}`);
    }
  }
  return values.join(', ');
}

function normalizeMetadataImages(
  images: MetadataImage | MetadataImage[] | undefined
): MetadataImage[] {
  if (!images) return [];
  return Array.isArray(images) ? images : [images];
}

function serializeOpenGraph(tags: MetadataTag[], openGraph: Metadata['openGraph'] | undefined) {
  if (!openGraph) return;

  pushMetaContent(tags, 'property', 'og:title', openGraph.title);
  pushMetaContent(tags, 'property', 'og:description', openGraph.description);
  pushMetaContent(tags, 'property', 'og:url', openGraph.url);
  pushMetaContent(tags, 'property', 'og:site_name', openGraph.siteName);
  pushMetaContent(tags, 'property', 'og:locale', openGraph.locale);
  pushMetaContent(tags, 'property', 'og:type', openGraph.type);

  for (const image of normalizeMetadataImages(openGraph.images)) {
    if (typeof image === 'string') {
      pushMetaContent(tags, 'property', 'og:image', image);
      continue;
    }

    pushMetaContent(tags, 'property', 'og:image', image.url);
    pushMetaContent(tags, 'property', 'og:image:alt', image.alt);
    pushMetaContent(
      tags,
      'property',
      'og:image:width',
      image.width != null ? String(image.width) : undefined
    );
    pushMetaContent(
      tags,
      'property',
      'og:image:height',
      image.height != null ? String(image.height) : undefined
    );
  }
}

function serializeTwitter(tags: MetadataTag[], twitter: Metadata['twitter'] | undefined) {
  if (!twitter) return;

  pushMetaContent(tags, 'name', 'twitter:card', twitter.card);
  pushMetaContent(tags, 'name', 'twitter:title', twitter.title);
  pushMetaContent(tags, 'name', 'twitter:description', twitter.description);
  pushMetaContent(tags, 'name', 'twitter:site', twitter.site);
  pushMetaContent(tags, 'name', 'twitter:creator', twitter.creator);

  const images = twitter.images
    ? Array.isArray(twitter.images)
      ? twitter.images
      : [twitter.images]
    : [];
  for (const image of images) {
    pushMetaContent(tags, 'name', 'twitter:image', image);
  }
}

function pushAlternateLinks(
  tags: MetadataTag[],
  rel: string,
  values: Record<string, string> | undefined,
  attributeName: 'hreflang' | 'media' | 'type'
) {
  if (!values) return;

  for (const [key, href] of Object.entries(values)) {
    if (!href) continue;
    tags.push({
      tagName: 'link',
      attributes: {
        rel,
        href,
        [attributeName]: key,
      },
    });
  }
}

function serializeAlternates(tags: MetadataTag[], alternates: Metadata['alternates'] | undefined) {
  if (!alternates) return;

  if (alternates.canonical) {
    tags.push({
      tagName: 'link',
      attributes: {
        rel: 'canonical',
        href: alternates.canonical,
      },
    });
  }

  pushAlternateLinks(tags, 'alternate', alternates.languages, 'hreflang');
  pushAlternateLinks(tags, 'alternate', alternates.media, 'media');
  pushAlternateLinks(tags, 'alternate', alternates.types, 'type');
}

function normalizeIconDescriptor(
  rel: string,
  descriptor: MetadataIconDescriptor
): Record<string, string> | null {
  if (typeof descriptor === 'string') {
    return { rel, href: descriptor };
  }

  if (!descriptor.url) {
    return null;
  }

  return {
    rel: descriptor.rel ?? rel,
    href: descriptor.url,
    ...(descriptor.type ? { type: descriptor.type } : {}),
    ...(descriptor.sizes ? { sizes: descriptor.sizes } : {}),
    ...(descriptor.media ? { media: descriptor.media } : {}),
  };
}

function pushIcons(
  tags: MetadataTag[],
  rel: string,
  descriptors: Metadata['icons'] extends infer T
    ? T extends null | undefined
      ? never
      : T[keyof T]
    : never
) {
  if (!descriptors) return;

  const items = Array.isArray(descriptors) ? descriptors : [descriptors];
  for (const descriptor of items) {
    const attributes = normalizeIconDescriptor(rel, descriptor);
    if (!attributes) continue;
    tags.push({
      tagName: 'link',
      attributes,
    });
  }
}

function serializeIcons(tags: MetadataTag[], icons: Metadata['icons'] | undefined) {
  if (!icons) return;

  pushIcons(tags, 'icon', icons.icon);
  pushIcons(tags, 'shortcut icon', icons.shortcut);
  pushIcons(tags, 'apple-touch-icon', icons.apple);
  pushIcons(tags, 'icon', icons.other);
}

function normalizeOtherValue(
  value: MetadataValue | MetadataValueArray | null | undefined
): string[] {
  if (value == null) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.map((entry) => String(entry));
}

function serializeOther(tags: MetadataTag[], other: Metadata['other']) {
  if (!other) return;

  for (const [key, value] of Object.entries(other)) {
    for (const normalizedValue of normalizeOtherValue(value)) {
      pushMetaContent(tags, 'name', key, normalizedValue);
    }
  }
}

export function serializeMetadataToTags(metadata: Metadata): MetadataTag[] {
  const tags: MetadataTag[] = [];

  if (metadata.title) {
    tags.push({
      tagName: 'title',
      content: metadata.title,
    });
  }

  pushMetaContent(tags, 'name', 'description', metadata.description);
  pushMetaContent(tags, 'name', 'application-name', metadata.applicationName);
  pushMetaContent(tags, 'name', 'keywords', toCommaSeparatedValue(metadata.keywords));
  pushMetaContent(tags, 'name', 'robots', serializeRobotsValue(metadata.robots));

  serializeAlternates(tags, metadata.alternates);
  serializeOpenGraph(tags, metadata.openGraph);
  serializeTwitter(tags, metadata.twitter);
  serializeIcons(tags, metadata.icons);
  serializeOther(tags, metadata.other);

  return tags;
}

export function serializeMetadataToHtml(metadata: Metadata): string {
  return serializeMetadataToTags(metadata).map(renderMetadataTag).join('');
}
