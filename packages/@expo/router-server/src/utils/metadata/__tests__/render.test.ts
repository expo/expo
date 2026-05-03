import { renderMetadataTags } from '../render';
import type { ResolvedMetadata } from '../types';

function metaName(name: string, content: string): MetadataTag {
  return { tagName: 'meta', attributes: { name, content } };
}

function metaProperty(property: string, content: string): MetadataTag {
  return { tagName: 'meta', attributes: { property, content } };
}

function link(attributes: Record<string, string>): MetadataTag {
  return { tagName: 'link', attributes };
}

function resolved(overrides: Partial<ResolvedMetadata> = {}): ResolvedMetadata {
  return {
    authors: [],
    archives: [],
    assets: [],
    bookmarks: [],
    other: [],
    ...overrides,
  };
}

describe(renderMetadataTags, () => {
  it('returns empty array for minimal resolved metadata', () => {
    expect(renderMetadataTags(resolved())).toEqual([]);
  });

  it('renders title tag', () => {
    const tags = renderMetadataTags(resolved({ title: 'Page' }));
    expect(tags).toContainEqual({ tagName: 'title', content: 'Page' });
  });

  it('renders basic metadata as name-based meta tags', () => {
    const tags = renderMetadataTags(
      resolved({
        description: 'A description',
        applicationName: 'App',
        keywords: 'alpha, beta',
        generator: 'Expo',
        referrer: 'origin',
      })
    );

    expect(tags).toContainEqual(metaName('description', 'A description'));
    expect(tags).toContainEqual(metaName('application-name', 'App'));
    expect(tags).toContainEqual(metaName('keywords', 'alpha, beta'));
    expect(tags).toContainEqual(metaName('generator', 'Expo'));
    expect(tags).toContainEqual(metaName('referrer', 'origin'));
  });

  it('renders authors as meta tags with optional link', () => {
    const tags = renderMetadataTags(
      resolved({
        authors: [
          { name: 'Author One' },
          { name: 'Author Two', url: 'https://example.dev/author-two' },
        ],
      })
    );

    expect(tags).toContainEqual(metaName('author', 'Author One'));
    expect(tags).toContainEqual(metaName('author', 'Author Two'));
    expect(tags).toContainEqual(link({ rel: 'author', href: 'https://example.dev/author-two' }));
  });

  it('renders creator, publisher, and category', () => {
    const tags = renderMetadataTags(
      resolved({ creator: 'Creator', publisher: 'Publisher', category: 'technology' })
    );

    expect(tags).toContainEqual(metaName('creator', 'Creator'));
    expect(tags).toContainEqual(metaName('publisher', 'Publisher'));
    expect(tags).toContainEqual(metaName('category', 'technology'));
  });

  it('renders robots and googlebot as separate meta tags', () => {
    const tags = renderMetadataTags(resolved({ robots: 'index, follow', googleBot: 'noindex' }));

    expect(tags).toContainEqual(metaName('robots', 'index, follow'));
    expect(tags).toContainEqual(metaName('googlebot', 'noindex'));
  });

  it('renders alternates as link tags', () => {
    const tags = renderMetadataTags(
      resolved({
        alternates: {
          canonical: 'https://example.dev',
          languages: [{ href: 'https://example.dev/en', hrefLang: 'en' }],
          media: [],
          types: [],
        },
      })
    );

    expect(tags).toContainEqual(link({ rel: 'canonical', href: 'https://example.dev' }));
    expect(tags).toContainEqual(
      link({ rel: 'alternate', href: 'https://example.dev/en', hreflang: 'en' })
    );
  });

  it('renders open graph basic and image tags as property-based meta', () => {
    const tags = renderMetadataTags(
      resolved({
        openGraph: {
          basic: [{ property: 'og:title', content: 'OG Title' }],
          images: [{ url: '/og.png', alt: 'Alt' }],
          videos: [],
          audio: [],
          article: [],
        },
      })
    );

    expect(tags).toContainEqual(metaProperty('og:title', 'OG Title'));
    expect(tags).toContainEqual(metaProperty('og:image', '/og.png'));
    expect(tags).toContainEqual(metaProperty('og:image:alt', 'Alt'));
  });

  it('renders open graph video and audio tags', () => {
    const tags = renderMetadataTags(
      resolved({
        openGraph: {
          basic: [],
          images: [],
          videos: [
            {
              url: 'https://example.dev/video.mp4',
              secureUrl: 'https://secure.example.dev/video.mp4',
              type: 'video/mp4',
              width: '800',
              height: '600',
            },
          ],
          audio: [
            {
              url: 'https://example.dev/audio.mp3',
              secureUrl: 'https://secure.example.dev/audio.mp3',
              type: 'audio/mpeg',
            },
          ],
          article: [],
        },
      })
    );

    expect(tags).toContainEqual(metaProperty('og:video', 'https://example.dev/video.mp4'));
    expect(tags).toContainEqual(
      metaProperty('og:video:secure_url', 'https://secure.example.dev/video.mp4')
    );
    expect(tags).toContainEqual(metaProperty('og:video:type', 'video/mp4'));
    expect(tags).toContainEqual(metaProperty('og:video:width', '800'));
    expect(tags).toContainEqual(metaProperty('og:video:height', '600'));
    expect(tags).toContainEqual(metaProperty('og:audio', 'https://example.dev/audio.mp3'));
    expect(tags).toContainEqual(
      metaProperty('og:audio:secure_url', 'https://secure.example.dev/audio.mp3')
    );
    expect(tags).toContainEqual(metaProperty('og:audio:type', 'audio/mpeg'));
  });

  it('renders open graph article tags', () => {
    const tags = renderMetadataTags(
      resolved({
        openGraph: {
          basic: [{ property: 'og:type', content: 'article' }],
          images: [],
          videos: [],
          audio: [],
          article: [
            { property: 'article:published_time', content: '2024-01-01T00:00:00.000Z' },
            { property: 'article:tag', content: 'expo' },
          ],
        },
      })
    );

    expect(tags).toContainEqual(metaProperty('article:published_time', '2024-01-01T00:00:00.000Z'));
    expect(tags).toContainEqual(metaProperty('article:tag', 'expo'));
  });

  it('renders twitter basic fields and images as name-based meta', () => {
    const tags = renderMetadataTags(
      resolved({
        twitter: {
          basic: [
            { name: 'twitter:card', content: 'summary' },
            { name: 'twitter:site', content: '@expo' },
          ],
          images: [{ url: '/og.png', alt: 'My Image' }],
          players: [],
          app: [],
        },
      })
    );

    expect(tags).toContainEqual(metaName('twitter:card', 'summary'));
    expect(tags).toContainEqual(metaName('twitter:site', '@expo'));
    expect(tags).toContainEqual(metaName('twitter:image', '/og.png'));
    expect(tags).toContainEqual(metaName('twitter:image:alt', 'My Image'));
  });

  it('renders twitter player tags', () => {
    const tags = renderMetadataTags(
      resolved({
        twitter: {
          basic: [],
          images: [],
          players: [
            {
              url: 'https://example.dev/player',
              width: '480',
              height: '360',
              stream: 'https://example.dev/stream.mp4',
            },
          ],
          app: [],
        },
      })
    );

    expect(tags).toContainEqual(metaName('twitter:player', 'https://example.dev/player'));
    expect(tags).toContainEqual(metaName('twitter:player:width', '480'));
    expect(tags).toContainEqual(metaName('twitter:player:height', '360'));
    expect(tags).toContainEqual(
      metaName('twitter:player:stream', 'https://example.dev/stream.mp4')
    );
  });

  it('renders twitter app tags', () => {
    const tags = renderMetadataTags(
      resolved({
        twitter: {
          basic: [],
          images: [],
          players: [],
          app: [
            { platform: 'iphone', name: 'My App', id: 'id123', url: 'https://iphone.example.dev' },
          ],
        },
      })
    );

    expect(tags).toContainEqual(metaName('twitter:app:name:iphone', 'My App'));
    expect(tags).toContainEqual(metaName('twitter:app:id:iphone', 'id123'));
    expect(tags).toContainEqual(metaName('twitter:app:url:iphone', 'https://iphone.example.dev'));
  });

  it('renders icon link tags', () => {
    const tags = renderMetadataTags(
      resolved({
        icons: {
          icon: [{ rel: 'icon', href: '/favicon.png' }],
          shortcut: [{ rel: 'shortcut icon', href: '/shortcut.png' }],
          apple: [{ rel: 'apple-touch-icon', href: '/apple.png' }],
          other: [],
        },
      })
    );

    expect(tags).toContainEqual(link({ rel: 'icon', href: '/favicon.png' }));
    expect(tags).toContainEqual(link({ rel: 'shortcut icon', href: '/shortcut.png' }));
    expect(tags).toContainEqual(link({ rel: 'apple-touch-icon', href: '/apple.png' }));
  });

  it('renders format detection', () => {
    const tags = renderMetadataTags(resolved({ formatDetection: 'telephone=no' }));
    expect(tags).toContainEqual(metaName('format-detection', 'telephone=no'));
  });

  it('renders verification tags with provider-specific names', () => {
    const tags = renderMetadataTags(
      resolved({
        verification: {
          google: ['google-123'],
          yahoo: ['yahoo-456'],
          yandex: ['yandex-789'],
          other: [{ name: 'me', content: 'my-link' }],
        },
      })
    );

    expect(tags).toContainEqual(metaName('google-site-verification', 'google-123'));
    expect(tags).toContainEqual(metaName('y_key', 'yahoo-456'));
    expect(tags).toContainEqual(metaName('yandex-verification', 'yandex-789'));
    expect(tags).toContainEqual(metaName('me', 'my-link'));
  });

  it('renders apple web app tags', () => {
    const tags = renderMetadataTags(
      resolved({
        appleWebApp: {
          capable: 'yes',
          title: 'My App',
          statusBarStyle: 'black-translucent',
          startupImages: [
            { href: '/startup-768.png' },
            { href: '/startup-1536.png', media: '(device-width: 768px)' },
          ],
        },
      })
    );

    expect(tags).toContainEqual(metaName('mobile-web-app-capable', 'yes'));
    expect(tags).toContainEqual(metaName('apple-mobile-web-app-title', 'My App'));
    expect(tags).toContainEqual(
      metaName('apple-mobile-web-app-status-bar-style', 'black-translucent')
    );
    expect(tags).toContainEqual(
      link({ rel: 'apple-touch-startup-image', href: '/startup-768.png' })
    );
    expect(tags).toContainEqual(
      link({
        rel: 'apple-touch-startup-image',
        href: '/startup-1536.png',
        media: '(device-width: 768px)',
      })
    );
  });

  it('renders itunes as name-based meta', () => {
    const tags = renderMetadataTags(
      resolved({ itunes: 'app-id=myAppId, app-argument=myArgument' })
    );

    expect(tags).toContainEqual(
      metaName('apple-itunes-app', 'app-id=myAppId, app-argument=myArgument')
    );
  });

  it('renders facebook as property-based meta', () => {
    const tags = renderMetadataTags(
      resolved({
        facebook: { appId: '12345678', admins: ['admin1', 'admin2'] },
      })
    );

    expect(tags).toContainEqual(metaProperty('fb:app_id', '12345678'));
    expect(tags).toContainEqual(metaProperty('fb:admins', 'admin1'));
    expect(tags).toContainEqual(metaProperty('fb:admins', 'admin2'));
  });

  it('renders pinterest as name-based meta', () => {
    const tags = renderMetadataTags(resolved({ pinterest: 'true' }));
    expect(tags).toContainEqual(metaName('pinterest-rich-pin', 'true'));
  });

  it('renders app links as property-based meta', () => {
    const tags = renderMetadataTags(
      resolved({
        appLinks: {
          ios: {
            url: 'https://example.dev/ios',
            appStoreId: 'app_store_id',
            appName: 'My iOS App',
          },
          android: {
            url: 'https://example.dev/android',
            package: 'com.example.android',
            appName: 'My Android App',
          },
          web: { url: 'https://example.dev', shouldFallback: 'true' },
        },
      })
    );

    expect(tags).toContainEqual(metaProperty('al:ios:url', 'https://example.dev/ios'));
    expect(tags).toContainEqual(metaProperty('al:ios:app_store_id', 'app_store_id'));
    expect(tags).toContainEqual(metaProperty('al:ios:app_name', 'My iOS App'));
    expect(tags).toContainEqual(metaProperty('al:android:url', 'https://example.dev/android'));
    expect(tags).toContainEqual(metaProperty('al:android:package', 'com.example.android'));
    expect(tags).toContainEqual(metaProperty('al:android:app_name', 'My Android App'));
    expect(tags).toContainEqual(metaProperty('al:web:url', 'https://example.dev'));
    expect(tags).toContainEqual(metaProperty('al:web:should_fallback', 'true'));
  });

  it('renders link relations', () => {
    const tags = renderMetadataTags(
      resolved({
        archives: ['https://example.dev/2023'],
        assets: ['https://example.dev/assets'],
        bookmarks: ['https://example.dev/bookmark'],
        manifest: '/manifest.json',
      })
    );

    expect(tags).toContainEqual(link({ rel: 'archives', href: 'https://example.dev/2023' }));
    expect(tags).toContainEqual(link({ rel: 'assets', href: 'https://example.dev/assets' }));
    expect(tags).toContainEqual(link({ rel: 'bookmarks', href: 'https://example.dev/bookmark' }));
    expect(tags).toContainEqual(link({ rel: 'manifest', href: '/manifest.json' }));
  });

  it('renders other tags', () => {
    const tags = renderMetadataTags(
      resolved({ other: [{ name: 'theme-color', content: '#fff' }] })
    );

    expect(tags).toContainEqual(metaName('theme-color', '#fff'));
  });
});
