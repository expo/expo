import { serializeMetadataToHtml, serializeMetadataToTags } from '../metadata';

describe(serializeMetadataToTags, () => {
  it('serializes metadata in stable tag order', () => {
    const result = serializeMetadataToTags({
      title: 'Page',
      description: 'Description',
      applicationName: 'App',
      keywords: ['alpha', 'beta'],
      robots: { index: false, follow: true },
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
      other: {
        'theme-color': '#fff',
      },
    }).map((tag) => tag.tagName === 'title' ? `title:${tag.content}` : `${tag.tagName}:${tag.attributes?.name ?? tag.attributes?.property ?? tag.attributes?.rel}`);

    expect(result).toEqual([
      'title:Page',
      'meta:description',
      'meta:application-name',
      'meta:keywords',
      'meta:robots',
      'link:canonical',
      'link:alternate',
      'meta:og:title',
      'meta:twitter:card',
      'link:icon',
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
});
