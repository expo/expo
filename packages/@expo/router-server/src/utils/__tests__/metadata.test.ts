import { serializeMetadataToHtml, serializeMetadataToTags } from '../metadata';

describe(serializeMetadataToTags, () => {
  it('serializes metadata in stable tag order', () => {
    const result = serializeMetadataToTags({
      title: 'Page',
      description: 'Description',
      applicationName: 'App',
      keywords: ['alpha', 'beta'],
      generator: 'Expo',
      referrer: 'origin',
      authors: [{ name: 'Author' }],
      creator: 'Creator',
      publisher: 'Publisher',
      category: 'technology',
      robots: { index: false, follow: true, googleBot: { index: true, follow: true } },
      alternates: {
        canonical: 'https://example.dev/page',
        languages: {
          en: 'https://example.dev/en/page',
        },
      },
      openGraph: {
        title: 'OG title',
      },
      twitter: {
        card: 'summary_large_image',
      },
      icons: {
        icon: '/icon.png',
      },
      formatDetection: { telephone: false },
      verification: { google: 'abc123' },
      appleWebApp: { title: 'My App' },
      itunes: { appId: '123' },
      facebook: { appId: '456' },
      pinterest: { richPin: true },
      appLinks: { ios: { url: 'https://example.dev' } },
      archives: ['https://example.dev/archives'],
      assets: ['https://example.dev/assets'],
      bookmarks: ['https://example.dev/bookmarks'],
      manifest: '/manifest.json',
      other: {
        'theme-color': '#fff',
      },
    }).map((tag) =>
      tag.tagName === 'title'
        ? `title:${tag.content}`
        : `${tag.tagName}:${tag.attributes?.name ?? tag.attributes?.property ?? tag.attributes?.rel}`
    );

      expect(result).toEqual([
        'title:Page',
        'meta:description',
        'meta:application-name',
      'meta:keywords',
      'meta:generator',
      'meta:referrer',
      'meta:author',
      'meta:creator',
      'meta:publisher',
      'meta:category',
      'meta:robots',
      'meta:googlebot',
      'link:canonical',
      'link:alternate',
      'meta:og:title',
        'meta:twitter:card',
      'link:icon',
      'meta:format-detection',
      'meta:google-site-verification',
      'meta:mobile-web-app-capable',
      'meta:apple-mobile-web-app-title',
      'meta:apple-itunes-app',
      'meta:fb:app_id',
      'meta:pinterest-rich-pin',
      'meta:al:ios:url',
      'link:archives',
      'link:assets',
      'link:bookmarks',
      'link:manifest',
      'meta:theme-color',
    ]);
  });
});

describe(serializeMetadataToHtml, () => {
  it('returns empty html for empty metadata', () => {
    expect(serializeMetadataToHtml({})).toBe('');
  });

  it('escapes text and attribute values safely', () => {
    const html = serializeMetadataToHtml({
      title: 'Hello <World>',
      description: 'Use "quotes" & tags',
      alternates: {
        canonical: 'https://example.dev/?q="quotes"&x=<tag>',
      },
    });

    expect(html).toContain('<title>Hello &lt;World&gt;</title>');
    expect(html).toContain('content="Use &quot;quotes&quot; &amp; tags"');
    expect(html).toContain('href="https://example.dev/?q=&quot;quotes&quot;&amp;x=&lt;tag&gt;"');
  });

  it('serializes repeated fields for arrays', () => {
    const html = serializeMetadataToHtml({
      openGraph: {
        images: ['/a.png', { url: '/b.png', alt: 'Alt' }],
      },
      twitter: {
        images: ['/a.png', '/b.png'],
      },
      other: {
        author: ['one', 'two'],
      },
    });

    expect(html).toContain('property="og:image" content="/a.png"');
    expect(html).toContain('property="og:image" content="/b.png"');
    expect(html).toContain('property="og:image:alt" content="Alt"');
    expect(html).toContain('name="twitter:image" content="/a.png"');
    expect(html).toContain('name="twitter:image" content="/b.png"');
    expect(html).toContain('name="author" content="one"');
    expect(html).toContain('name="author" content="two"');
  });

  describe('robots', () => {
    it('serializes googleBot as a separate meta tag', () => {
      const html = serializeMetadataToHtml({
        robots: {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            'max-image-preview': 'large',
            'max-video-preview': -1,
            'max-snippet': -1,
          },
        },
      });

      expect(html).toContain('name="robots" content="index, follow"');
      expect(html).toContain(
        'name="googlebot" content="index, follow, max-image-preview:large, max-video-preview:-1, max-snippet:-1"'
      );
    });

    it('serializes googleBot as a string', () => {
      const html = serializeMetadataToHtml({
        robots: {
          index: true,
          googleBot: 'noindex, nofollow',
        },
      });

      expect(html).toContain('name="robots" content="index"');
      expect(html).toContain('name="googlebot" content="noindex, nofollow"');
    });
  });

  describe('openGraph', () => {
    it('serializes videos', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          videos: [
            {
              url: 'https://example.dev/video.mp4',
              width: 800,
              height: 600,
              type: 'video/mp4',
              secureUrl: 'https://secure.example.dev/video.mp4',
            },
          ],
        },
      });

      expect(html).toContain('property="og:video" content="https://example.dev/video.mp4"');
      expect(html).toContain(
        'property="og:video:secure_url" content="https://secure.example.dev/video.mp4"'
      );
      expect(html).toContain('property="og:video:type" content="video/mp4"');
      expect(html).toContain('property="og:video:width" content="800"');
      expect(html).toContain('property="og:video:height" content="600"');
    });

    it('serializes video as a string', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          videos: 'https://example.dev/video.mp4',
        },
      });

      expect(html).toContain('property="og:video" content="https://example.dev/video.mp4"');
    });

    it('serializes audio', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          audio: [
            {
              url: 'https://example.dev/audio.mp3',
              type: 'audio/mpeg',
              secureUrl: 'https://secure.example.dev/audio.mp3',
            },
          ],
        },
      });

      expect(html).toContain('property="og:audio" content="https://example.dev/audio.mp3"');
      expect(html).toContain(
        'property="og:audio:secure_url" content="https://secure.example.dev/audio.mp3"'
      );
      expect(html).toContain('property="og:audio:type" content="audio/mpeg"');
    });

    it('serializes audio as a string', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          audio: 'https://example.dev/audio.mp3',
        },
      });

      expect(html).toContain('property="og:audio" content="https://example.dev/audio.mp3"');
    });

    it('serializes image type and secureUrl', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          images: [
            {
              url: '/og.png',
              type: 'image/png',
              secureUrl: 'https://secure.example.dev/og.png',
            },
          ],
        },
      });

      expect(html).toContain('property="og:image:type" content="image/png"');
      expect(html).toContain(
        'property="og:image:secure_url" content="https://secure.example.dev/og.png"'
      );
    });

    it('serializes article-specific fields', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          type: 'article',
          publishedTime: '2024-01-01T00:00:00.000Z',
          modifiedTime: '2024-01-02T00:00:00.000Z',
          expirationTime: '2025-01-01T00:00:00.000Z',
          section: 'Technology',
          tags: ['expo', 'react'],
          authors: ['Author One', 'Author Two'],
        },
      });

      expect(html).toContain(
        'property="article:published_time" content="2024-01-01T00:00:00.000Z"'
      );
      expect(html).toContain(
        'property="article:modified_time" content="2024-01-02T00:00:00.000Z"'
      );
      expect(html).toContain(
        'property="article:expiration_time" content="2025-01-01T00:00:00.000Z"'
      );
      expect(html).toContain('property="article:section" content="Technology"');
      expect(html).toContain('property="article:tag" content="expo"');
      expect(html).toContain('property="article:tag" content="react"');
      expect(html).toContain('property="article:author" content="Author One"');
      expect(html).toContain('property="article:author" content="Author Two"');
    });

    it('serializes additional OG properties', () => {
      const html = serializeMetadataToHtml({
        openGraph: {
          determiner: 'the',
          countryName: 'United States',
          ttl: 3600,
          alternateLocale: ['fr_FR', 'de_DE'],
          emails: ['info@example.dev'],
          phoneNumbers: ['+1234567890'],
          faxNumbers: ['+0987654321'],
        },
      });

      expect(html).toContain('property="og:determiner" content="the"');
      expect(html).toContain('property="og:country_name" content="United States"');
      expect(html).toContain('property="og:ttl" content="3600"');
      expect(html).toContain('property="og:locale:alternate" content="fr_FR"');
      expect(html).toContain('property="og:locale:alternate" content="de_DE"');
      expect(html).toContain('property="og:email" content="info@example.dev"');
      expect(html).toContain('property="og:phone_number" content="+1234567890"');
      expect(html).toContain('property="og:fax_number" content="+0987654321"');
    });
  });

  describe('twitter', () => {
    it('serializes siteId and creatorId', () => {
      const html = serializeMetadataToHtml({
        twitter: {
          card: 'summary',
          site: '@expo',
          siteId: '123456',
          creator: '@expodev',
          creatorId: '789012',
        },
      });

      expect(html).toContain('name="twitter:site" content="@expo"');
      expect(html).toContain('name="twitter:site:id" content="123456"');
      expect(html).toContain('name="twitter:creator" content="@expodev"');
      expect(html).toContain('name="twitter:creator:id" content="789012"');
    });

    it('serializes image objects with alt text', () => {
      const html = serializeMetadataToHtml({
        twitter: {
          images: [{ url: '/og.png', alt: 'My Image' }],
        },
      });

      expect(html).toContain('name="twitter:image" content="/og.png"');
      expect(html).toContain('name="twitter:image:alt" content="My Image"');
    });

    it('serializes player cards', () => {
      const html = serializeMetadataToHtml({
        twitter: {
          card: 'player',
          players: {
            url: 'https://example.dev/player',
            width: 480,
            height: 360,
            stream: 'https://example.dev/stream.mp4',
          },
        },
      });

      expect(html).toContain('name="twitter:player" content="https://example.dev/player"');
      expect(html).toContain('name="twitter:player:width" content="480"');
      expect(html).toContain('name="twitter:player:height" content="360"');
      expect(html).toContain(
        'name="twitter:player:stream" content="https://example.dev/stream.mp4"'
      );
    });

    it('serializes app cards', () => {
      const html = serializeMetadataToHtml({
        twitter: {
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
        },
      });

      expect(html).toContain('name="twitter:app:name:iphone" content="My App"');
      expect(html).toContain('name="twitter:app:name:ipad" content="My App"');
      expect(html).toContain('name="twitter:app:name:googleplay" content="My App"');
      expect(html).toContain('name="twitter:app:id:iphone" content="id123"');
      expect(html).toContain('name="twitter:app:id:ipad" content="id456"');
      expect(html).toContain('name="twitter:app:id:googleplay" content="com.example.app"');
      expect(html).toContain(
        'name="twitter:app:url:iphone" content="https://iphone.example.dev"'
      );
      expect(html).toContain('name="twitter:app:url:ipad" content="https://ipad.example.dev"');
      expect(html).toContain(
        'name="twitter:app:url:googleplay" content="https://play.example.dev"'
      );
    });
  });

  describe('simple top-level fields', () => {
    it('serializes generator, referrer, creator, publisher, and category', () => {
      const html = serializeMetadataToHtml({
        generator: 'Expo',
        referrer: 'origin-when-cross-origin',
        creator: 'Expo Team',
        publisher: 'Expo Inc.',
        category: 'technology',
      });

      expect(html).toContain('name="generator" content="Expo"');
      expect(html).toContain('name="referrer" content="origin-when-cross-origin"');
      expect(html).toContain('name="creator" content="Expo Team"');
      expect(html).toContain('name="publisher" content="Expo Inc."');
      expect(html).toContain('name="category" content="technology"');
    });

    it('serializes authors with name and url', () => {
      const html = serializeMetadataToHtml({
        authors: [
          { name: 'Author One' },
          { name: 'Author Two', url: 'https://example.dev/author-two' },
        ],
      });

      expect(html).toContain('name="author" content="Author One"');
      expect(html).toContain('name="author" content="Author Two"');
      expect(html).toContain('rel="author" href="https://example.dev/author-two"');
    });

    it('serializes a single author', () => {
      const html = serializeMetadataToHtml({
        authors: { name: 'Solo Author', url: 'https://example.dev' },
      });

      expect(html).toContain('name="author" content="Solo Author"');
      expect(html).toContain('rel="author" href="https://example.dev"');
    });
  });

  describe('formatDetection', () => {
    it('serializes all format detection options', () => {
      const html = serializeMetadataToHtml({
        formatDetection: {
          telephone: false,
          address: false,
          email: false,
          date: true,
          url: true,
        },
      });

      expect(html).toContain(
        'name="format-detection" content="telephone=no, date=yes, address=no, email=no, url=yes"'
      );
    });

    it('serializes partial format detection', () => {
      const html = serializeMetadataToHtml({
        formatDetection: {
          telephone: false,
        },
      });

      expect(html).toContain('name="format-detection" content="telephone=no"');
    });
  });

  describe('verification', () => {
    it('serializes verification providers', () => {
      const html = serializeMetadataToHtml({
        verification: {
          google: 'google-123',
          yahoo: 'yahoo-456',
          yandex: 'yandex-789',
        },
      });

      expect(html).toContain('name="google-site-verification" content="google-123"');
      expect(html).toContain('name="y_key" content="yahoo-456"');
      expect(html).toContain('name="yandex-verification" content="yandex-789"');
    });

    it('serializes custom verification providers', () => {
      const html = serializeMetadataToHtml({
        verification: {
          other: {
            me: ['my-email', 'my-link'],
          },
        },
      });

      expect(html).toContain('name="me" content="my-email"');
      expect(html).toContain('name="me" content="my-link"');
    });
  });

  describe('appleWebApp', () => {
    it('serializes apple web app metadata', () => {
      const html = serializeMetadataToHtml({
        appleWebApp: {
          capable: true,
          title: 'My App',
          statusBarStyle: 'black-translucent',
          startupImage: [
            '/startup-768.png',
            {
              url: '/startup-1536.png',
              media: '(device-width: 768px) and (device-height: 1024px)',
            },
          ],
        },
      });

      expect(html).toContain('name="mobile-web-app-capable" content="yes"');
      expect(html).toContain('name="apple-mobile-web-app-title" content="My App"');
      expect(html).toContain(
        'name="apple-mobile-web-app-status-bar-style" content="black-translucent"'
      );
      expect(html).toContain('rel="apple-touch-startup-image" href="/startup-768.png"');
      expect(html).toContain(
        'rel="apple-touch-startup-image" href="/startup-1536.png" media="(device-width: 768px) and (device-height: 1024px)"'
      );
    });

    it('serializes capable as yes by default when omitted', () => {
      const html = serializeMetadataToHtml({
        appleWebApp: { title: 'My App' },
      });

      expect(html).toContain('name="mobile-web-app-capable" content="yes"');
    });

    it('serializes capable as no when false', () => {
      const html = serializeMetadataToHtml({
        appleWebApp: { capable: false },
      });

      expect(html).toContain('name="mobile-web-app-capable" content="no"');
    });
  });

  describe('itunes', () => {
    it('serializes itunes app metadata', () => {
      const html = serializeMetadataToHtml({
        itunes: {
          appId: 'myAppId',
          appArgument: 'myArgument',
        },
      });

      expect(html).toContain(
        'name="apple-itunes-app" content="app-id=myAppId, app-argument=myArgument"'
      );
    });

    it('serializes itunes with only appId', () => {
      const html = serializeMetadataToHtml({
        itunes: { appId: 'myAppId' },
      });

      expect(html).toContain('name="apple-itunes-app" content="app-id=myAppId"');
    });
  });

  describe('facebook', () => {
    it('serializes facebook appId', () => {
      const html = serializeMetadataToHtml({
        facebook: { appId: '12345678' },
      });

      expect(html).toContain('property="fb:app_id" content="12345678"');
    });

    it('serializes facebook admins as array', () => {
      const html = serializeMetadataToHtml({
        facebook: { admins: ['admin1', 'admin2'] },
      });

      expect(html).toContain('property="fb:admins" content="admin1"');
      expect(html).toContain('property="fb:admins" content="admin2"');
    });
  });

  describe('pinterest', () => {
    it('serializes pinterest rich pin', () => {
      const html = serializeMetadataToHtml({
        pinterest: { richPin: true },
      });

      expect(html).toContain('name="pinterest-rich-pin" content="true"');
    });

    it('serializes pinterest rich pin as false', () => {
      const html = serializeMetadataToHtml({
        pinterest: { richPin: false },
      });

      expect(html).toContain('name="pinterest-rich-pin" content="false"');
    });
  });

  describe('appLinks', () => {
    it('serializes app links for all platforms', () => {
      const html = serializeMetadataToHtml({
        appLinks: {
          ios: {
            url: 'https://example.dev/ios',
            appStoreId: 'app_store_id',
            appName: 'My iOS App',
          },
          android: {
            package: 'com.example.android',
            url: 'https://example.dev/android',
            appName: 'My Android App',
          },
          web: {
            url: 'https://example.dev',
            shouldFallback: true,
          },
        },
      });

      expect(html).toContain('property="al:ios:url" content="https://example.dev/ios"');
      expect(html).toContain('property="al:ios:app_store_id" content="app_store_id"');
      expect(html).toContain('property="al:ios:app_name" content="My iOS App"');
      expect(html).toContain('property="al:android:url" content="https://example.dev/android"');
      expect(html).toContain('property="al:android:package" content="com.example.android"');
      expect(html).toContain('property="al:android:app_name" content="My Android App"');
      expect(html).toContain('property="al:web:url" content="https://example.dev"');
      expect(html).toContain('property="al:web:should_fallback" content="true"');
    });
  });

  describe('link-based fields', () => {
    it('serializes archives, assets, and bookmarks', () => {
      const html = serializeMetadataToHtml({
        archives: ['https://example.dev/2023'],
        assets: ['https://example.dev/assets'],
        bookmarks: ['https://example.dev/bookmark'],
      });

      expect(html).toContain('rel="archives" href="https://example.dev/2023"');
      expect(html).toContain('rel="assets" href="https://example.dev/assets"');
      expect(html).toContain('rel="bookmarks" href="https://example.dev/bookmark"');
    });

    it('serializes manifest', () => {
      const html = serializeMetadataToHtml({
        manifest: '/manifest.json',
      });

      expect(html).toContain('rel="manifest" href="/manifest.json"');
    });
  });
});
