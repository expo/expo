import {
  resolveAppleWebApp,
  resolveMetadata,
  resolveOpenGraph,
  resolveOther,
  resolveRobots,
  resolveTwitter,
  resolveVerification,
} from '../resolve';

describe(resolveRobots, () => {
  it('returns empty object for undefined', () => {
    expect(resolveRobots(undefined)).toEqual({});
  });

  it('emits robots and googleBot strings', () => {
    expect(
      resolveRobots({
        index: true,
        follow: false,
        googleBot: {
          index: true,
          'max-image-preview': 'large',
        },
      })
    ).toEqual({
      robots: 'index, nofollow',
      googleBot: 'index, max-image-preview:large',
    });
  });

  it('serializes googleBot with all directives', () => {
    expect(
      resolveRobots({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-video-preview': -1,
          'max-snippet': -1,
        },
      })
    ).toEqual({
      robots: 'index, follow',
      googleBot: 'index, follow, max-image-preview:large, max-video-preview:-1, max-snippet:-1',
    });
  });

  it('handles googleBot as a string', () => {
    expect(
      resolveRobots({
        index: true,
        googleBot: 'noindex, nofollow',
      })
    ).toEqual({
      robots: 'index',
      googleBot: 'noindex, nofollow',
    });
  });

  it('does not double-negate negative directives set to false', () => {
    const result = resolveRobots({
      index: false,
      follow: false,
      noarchive: false,
      nosnippet: false,
      noimageindex: true,
      nocache: true,
      notranslate: true,
    });

    expect(result.robots).toBe('noindex, nofollow, noimageindex, nocache, notranslate');
    expect(result.robots).not.toContain('nonoarchive');
    expect(result.robots).not.toContain('nonosnippet');
  });
});

describe(resolveOpenGraph, () => {
  it('returns undefined for undefined input', () => {
    expect(resolveOpenGraph(undefined)).toBeUndefined();
  });

  it('resolves basic OpenGraph fields', () => {
    const result = resolveOpenGraph({
      title: 'OG Title',
      description: 'OG Desc',
      url: 'https://example.dev',
      siteName: 'Example',
      locale: 'en_US',
      type: 'website',
    });

    expect(result?.basic).toEqual([
      { property: 'og:title', content: 'OG Title' },
      { property: 'og:description', content: 'OG Desc' },
      { property: 'og:url', content: 'https://example.dev' },
      { property: 'og:site_name', content: 'Example' },
      { property: 'og:locale', content: 'en_US' },
      { property: 'og:type', content: 'website' },
    ]);
  });

  it('resolves additional OpenGraph properties', () => {
    const result = resolveOpenGraph({
      determiner: 'the',
      countryName: 'United States',
      ttl: 3600,
      alternateLocale: ['fr_FR', 'de_DE'],
      emails: ['info@example.dev'],
      phoneNumbers: ['+1234567890'],
      faxNumbers: ['+0987654321'],
    });

    expect(result?.basic).toContainEqual({
      property: 'og:determiner',
      content: 'the',
    });
    expect(result?.basic).toContainEqual({
      property: 'og:country_name',
      content: 'United States',
    });
    expect(result?.basic).toContainEqual({ property: 'og:ttl', content: '3600' });
    expect(result?.basic).toContainEqual({ property: 'og:locale:alternate', content: 'fr_FR' });
    expect(result?.basic).toContainEqual({ property: 'og:locale:alternate', content: 'de_DE' });
    expect(result?.basic).toContainEqual({ property: 'og:email', content: 'info@example.dev' });
    expect(result?.basic).toContainEqual({
      property: 'og:phone_number',
      content: '+1234567890',
    });
    expect(result?.basic).toContainEqual({
      property: 'og:fax_number',
      content: '+0987654321',
    });
  });

  it('resolves image objects with all properties', () => {
    const result = resolveOpenGraph({
      images: [
        {
          url: '/og.png',
          alt: 'Alt text',
          width: 1200,
          height: 630,
          type: 'image/png',
          secureUrl: 'https://secure.example.dev/og.png',
        },
      ],
    });

    expect(result?.images).toEqual([
      {
        url: '/og.png',
        alt: 'Alt text',
        width: '1200',
        height: '630',
        type: 'image/png',
        secureUrl: 'https://secure.example.dev/og.png',
      },
    ]);
  });

  it('resolves image strings', () => {
    const result = resolveOpenGraph({
      images: ['/a.png', '/b.png'],
    });

    expect(result?.images).toEqual([{ url: '/a.png' }, { url: '/b.png' }]);
  });

  it('resolves video objects with all properties', () => {
    const result = resolveOpenGraph({
      videos: [
        {
          url: 'https://example.dev/video.mp4',
          width: 800,
          height: 600,
          type: 'video/mp4',
          secureUrl: 'https://secure.example.dev/video.mp4',
        },
      ],
    });

    expect(result?.videos).toEqual([
      {
        url: 'https://example.dev/video.mp4',
        secureUrl: 'https://secure.example.dev/video.mp4',
        type: 'video/mp4',
        width: '800',
        height: '600',
      },
    ]);
  });

  it('resolves video from string', () => {
    const result = resolveOpenGraph({
      videos: 'https://example.dev/video.mp4',
    });

    expect(result?.videos).toEqual([{ url: 'https://example.dev/video.mp4' }]);
  });

  it('resolves audio objects', () => {
    const result = resolveOpenGraph({
      audio: [
        {
          url: 'https://example.dev/audio.mp3',
          type: 'audio/mpeg',
          secureUrl: 'https://secure.example.dev/audio.mp3',
        },
      ],
    });

    expect(result?.audio).toEqual([
      {
        url: 'https://example.dev/audio.mp3',
        secureUrl: 'https://secure.example.dev/audio.mp3',
        type: 'audio/mpeg',
      },
    ]);
  });

  it('resolves audio from string', () => {
    const result = resolveOpenGraph({
      audio: 'https://example.dev/audio.mp3',
    });

    expect(result?.audio).toEqual([{ url: 'https://example.dev/audio.mp3' }]);
  });

  it('resolves article-specific fields', () => {
    const result = resolveOpenGraph({
      type: 'article',
      publishedTime: '2024-01-01T00:00:00.000Z',
      modifiedTime: '2024-01-02T00:00:00.000Z',
      expirationTime: '2025-01-01T00:00:00.000Z',
      section: 'Technology',
      tags: ['expo', 'react'],
      authors: ['Author One', 'Author Two'],
    });

    expect(result?.article).toEqual([
      { property: 'article:published_time', content: '2024-01-01T00:00:00.000Z' },
      { property: 'article:modified_time', content: '2024-01-02T00:00:00.000Z' },
      { property: 'article:expiration_time', content: '2025-01-01T00:00:00.000Z' },
      { property: 'article:section', content: 'Technology' },
      { property: 'article:tag', content: 'expo' },
      { property: 'article:tag', content: 'react' },
      { property: 'article:author', content: 'Author One' },
      { property: 'article:author', content: 'Author Two' },
    ]);
  });

  it('drops article fields for non-article types', () => {
    const result = resolveOpenGraph({
      type: 'website',
      publishedTime: '2024-01-01T00:00:00.000Z',
      tags: ['expo'],
      authors: ['Author One'],
    });

    expect(result?.article).toEqual([]);
  });
});

describe(resolveTwitter, () => {
  it('returns undefined for undefined input', () => {
    expect(resolveTwitter(undefined)).toBeUndefined();
  });

  it('resolves basic fields including siteId and creatorId', () => {
    const result = resolveTwitter({
      card: 'summary',
      site: '@expo',
      siteId: '123456',
      creator: '@expodev',
      creatorId: '789012',
    });

    expect(result?.basic).toEqual([
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@expo' },
      { name: 'twitter:site:id', content: '123456' },
      { name: 'twitter:creator', content: '@expodev' },
      { name: 'twitter:creator:id', content: '789012' },
    ]);
  });

  it('resolves image objects with alt text', () => {
    const result = resolveTwitter({
      images: [{ url: '/og.png', alt: 'My Image' }],
    });

    expect(result?.images).toEqual([{ url: '/og.png', alt: 'My Image' }]);
  });

  it('resolves image strings', () => {
    const result = resolveTwitter({
      images: ['/a.png', '/b.png'],
    });

    expect(result?.images).toEqual([{ url: '/a.png' }, { url: '/b.png' }]);
  });

  it('resolves player cards', () => {
    const result = resolveTwitter({
      card: 'player',
      players: {
        url: 'https://example.dev/player',
        width: 480,
        height: 360,
        stream: 'https://example.dev/stream.mp4',
      },
    });

    expect(result?.players).toEqual([
      {
        url: 'https://example.dev/player',
        width: '480',
        height: '360',
        stream: 'https://example.dev/stream.mp4',
      },
    ]);
  });

  it('resolves app cards', () => {
    const result = resolveTwitter({
      card: 'app',
      app: {
        name: 'My App',
        id: {
          iphone: 'id123',
          ipad: 'id456',
          googleplay: 'com.example.app',
        },
        url: {
          iphone: 'https://iphone.example.dev',
          ipad: 'https://ipad.example.dev',
          googleplay: 'https://play.example.dev',
        },
      },
    });

    expect(result?.app).toEqual([
      {
        platform: 'iphone',
        name: 'My App',
        id: 'id123',
        url: 'https://iphone.example.dev',
      },
      {
        platform: 'ipad',
        name: 'My App',
        id: 'id456',
        url: 'https://ipad.example.dev',
      },
      {
        platform: 'googleplay',
        name: 'My App',
        id: 'com.example.app',
        url: 'https://play.example.dev',
      },
    ]);
  });
});

describe(resolveVerification, () => {
  it('returns undefined for undefined input', () => {
    expect(resolveVerification(undefined)).toBeUndefined();
  });

  it('normalizes provider values to arrays', () => {
    expect(
      resolveVerification({
        google: 'google-123',
        yahoo: 'yahoo-456',
        yandex: 'yandex-789',
      })
    ).toEqual({
      google: ['google-123'],
      yahoo: ['yahoo-456'],
      yandex: ['yandex-789'],
      other: [],
    });
  });

  it('flattens provider arrays', () => {
    expect(
      resolveVerification({
        google: ['abc', 'def'],
        other: {
          me: ['mailto:test@example.dev', 'https://example.dev/about'],
        },
      })
    ).toEqual({
      google: ['abc', 'def'],
      yahoo: [],
      yandex: [],
      other: [
        { name: 'me', content: 'mailto:test@example.dev' },
        { name: 'me', content: 'https://example.dev/about' },
      ],
    });
  });
});

describe(resolveAppleWebApp, () => {
  it('returns undefined for undefined input', () => {
    expect(resolveAppleWebApp(undefined)).toBeUndefined();
  });

  it('sets capable to yes by default', () => {
    expect(resolveAppleWebApp({ title: 'My App' })).toEqual({
      capable: 'yes',
      title: 'My App',
      statusBarStyle: undefined,
      startupImages: [],
    });
  });

  it('normalizes startupImage descriptors', () => {
    expect(
      resolveAppleWebApp({
        title: 'My App',
        statusBarStyle: 'black-translucent',
        startupImage: [
          '/startup-768.png',
          {
            url: '/startup-1536.png',
            media: '(device-width: 768px)',
          },
        ],
      })
    ).toEqual({
      capable: 'yes',
      title: 'My App',
      statusBarStyle: 'black-translucent',
      startupImages: [
        { href: '/startup-768.png' },
        { href: '/startup-1536.png', media: '(device-width: 768px)' },
      ],
    });
  });
});

describe(resolveOther, () => {
  it('returns empty array for undefined', () => {
    expect(resolveOther(undefined)).toEqual([]);
  });

  it('repeats array values', () => {
    expect(
      resolveOther({
        author: ['one', 'two'],
      })
    ).toEqual([
      { name: 'author', content: 'one' },
      { name: 'author', content: 'two' },
    ]);
  });

  it('stringifies numeric values', () => {
    expect(resolveOther({ rating: 5 })).toEqual([{ name: 'rating', content: '5' }]);
  });
});

describe(resolveMetadata, () => {
  it('resolves basic metadata fields', () => {
    const result = resolveMetadata({
      title: 'Page',
      description: 'A description',
      applicationName: 'App',
      generator: 'Expo',
      referrer: 'origin-when-cross-origin',
      creator: 'Expo Team',
      publisher: 'Expo Inc.',
      category: 'technology',
    });

    expect(result.title).toBe('Page');
    expect(result.description).toBe('A description');
    expect(result.applicationName).toBe('App');
    expect(result.generator).toBe('Expo');
    expect(result.referrer).toBe('origin-when-cross-origin');
    expect(result.creator).toBe('Expo Team');
    expect(result.publisher).toBe('Expo Inc.');
    expect(result.category).toBe('technology');
  });

  it('joins keyword arrays into comma-separated string', () => {
    expect(resolveMetadata({ keywords: ['alpha', 'beta'] }).keywords).toBe('alpha, beta');
  });

  it('passes keyword string through unchanged', () => {
    expect(resolveMetadata({ keywords: 'alpha, beta' }).keywords).toBe('alpha, beta');
  });

  it('resolves authors with name and url', () => {
    const result = resolveMetadata({
      authors: [
        { name: 'Author One' },
        { name: 'Author Two', url: 'https://example.dev/author-two' },
      ],
    });

    expect(result.authors).toEqual([
      { name: 'Author One', url: undefined },
      { name: 'Author Two', url: 'https://example.dev/author-two' },
    ]);
  });

  it('normalizes a single author to array', () => {
    const result = resolveMetadata({
      authors: { name: 'Solo Author', url: 'https://example.dev' },
    });

    expect(result.authors).toEqual([{ name: 'Solo Author', url: 'https://example.dev' }]);
  });

  it('resolves format detection options', () => {
    expect(
      resolveMetadata({
        formatDetection: { telephone: false, address: false, email: false, date: true, url: true },
      }).formatDetection
    ).toBe('telephone=no, date=yes, address=no, email=no, url=yes');
  });

  it('resolves partial format detection', () => {
    expect(resolveMetadata({ formatDetection: { telephone: false } }).formatDetection).toBe(
      'telephone=no'
    );
  });

  it('resolves itunes app metadata', () => {
    expect(
      resolveMetadata({ itunes: { appId: 'myAppId', appArgument: 'myArgument' } }).itunes
    ).toBe('app-id=myAppId, app-argument=myArgument');
  });

  it('resolves itunes with only appId', () => {
    expect(resolveMetadata({ itunes: { appId: 'myAppId' } }).itunes).toBe('app-id=myAppId');
  });

  it('resolves facebook metadata', () => {
    const result = resolveMetadata({
      facebook: { appId: '12345678', admins: ['admin1', 'admin2'] },
    });
    expect(result.facebook).toEqual({ appId: '12345678', admins: ['admin1', 'admin2'] });
  });

  it('resolves pinterest rich pin', () => {
    expect(resolveMetadata({ pinterest: { richPin: true } }).pinterest).toBe('true');
    expect(resolveMetadata({ pinterest: { richPin: false } }).pinterest).toBe('false');
  });

  it('resolves app links for all platforms', () => {
    const result = resolveMetadata({
      appLinks: {
        ios: { url: 'https://example.dev/ios', appStoreId: 'app_store_id', appName: 'My iOS App' },
        android: {
          package: 'com.example.android',
          url: 'https://example.dev/android',
          appName: 'My Android App',
        },
        web: { url: 'https://example.dev', shouldFallback: true },
      },
    });

    expect(result.appLinks).toEqual({
      ios: { url: 'https://example.dev/ios', appStoreId: 'app_store_id', appName: 'My iOS App' },
      android: {
        url: 'https://example.dev/android',
        package: 'com.example.android',
        appName: 'My Android App',
      },
      web: { url: 'https://example.dev', shouldFallback: 'true' },
    });
  });

  it('resolves alternates', () => {
    const result = resolveMetadata({
      alternates: {
        canonical: 'https://example.dev/page',
        languages: { en: 'https://example.dev/en/page' },
      },
    });

    expect(result.alternates).toEqual({
      canonical: 'https://example.dev/page',
      languages: [{ href: 'https://example.dev/en/page', hrefLang: 'en' }],
      media: [],
      types: [],
    });
  });

  it('passes through archives, assets, bookmarks, and manifest', () => {
    const result = resolveMetadata({
      archives: ['https://example.dev/2023'],
      assets: ['https://example.dev/assets'],
      bookmarks: ['https://example.dev/bookmark'],
      manifest: '/manifest.json',
    });

    expect(result.archives).toEqual(['https://example.dev/2023']);
    expect(result.assets).toEqual(['https://example.dev/assets']);
    expect(result.bookmarks).toEqual(['https://example.dev/bookmark']);
    expect(result.manifest).toBe('/manifest.json');
  });

  it('defaults arrays to empty when not provided', () => {
    const result = resolveMetadata({});

    expect(result.authors).toEqual([]);
    expect(result.archives).toEqual([]);
    expect(result.assets).toEqual([]);
    expect(result.bookmarks).toEqual([]);
    expect(result.other).toEqual([]);
  });
});
