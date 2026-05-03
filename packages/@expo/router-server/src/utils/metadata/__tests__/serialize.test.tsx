import {
  serializeMetadataToHtml,
  serializeMetadataToReact,
  serializeMetadataToTags,
} from '../serialize';

describe(serializeMetadataToTags, () => {
  it('returns empty array for empty metadata', () => {
    expect(serializeMetadataToTags({})).toEqual([]);
  });
});

describe(serializeMetadataToHtml, () => {
  it('returns empty string for empty metadata', () => {
    expect(serializeMetadataToHtml({})).toBe('');
  });

  it('produces HTML from metadata end-to-end', () => {
    const html = serializeMetadataToHtml({
      title: 'Page',
      description: 'A description',
    });

    expect(html).toContain('<title>Page</title>');
    expect(html).toContain('<meta name="description" content="A description">');
  });
});

describe(serializeMetadataToReact, () => {
  it('returns empty array for empty metadata', () => {
    expect(serializeMetadataToReact({})).toEqual([]);
  });

  it('renders title as a <title> element', () => {
    const nodes = serializeMetadataToReact({ title: 'My Page' });

    expect(nodes).toEqual([<title key="metadata-title">My Page</title>]);
  });

  it('renders <meta> tags as self-closing elements', () => {
    const nodes = serializeMetadataToReact({
      description: 'A description',
      keywords: ['a', 'b'],
    });

    expect(nodes).toEqual([
      <meta key="metadata-meta-0" name="description" content="A description" />,
      <meta key="metadata-meta-1" name="keywords" content="a, b" />,
    ]);
  });

  it('renders <link> tags with correct attributes', () => {
    const nodes = serializeMetadataToReact({
      alternates: { canonical: 'https://example.dev' },
      icons: { icon: '/favicon.png' },
    });

    expect(nodes).toEqual([
      <link key="metadata-link-0" rel="canonical" href="https://example.dev" />,
      <link key="metadata-link-1" rel="icon" href="/favicon.png" />,
    ]);
  });

  it('renders OpenGraph property-based <meta> tags', () => {
    const nodes = serializeMetadataToReact({
      openGraph: { title: 'OG Title', description: 'OG Desc' },
    });

    expect(nodes).toEqual([
      <meta key="metadata-meta-0" property="og:title" content="OG Title" />,
      <meta key="metadata-meta-1" property="og:description" content="OG Desc" />,
    ]);
  });

  it('renders a full metadata object with mixed tag types', () => {
    const nodes = serializeMetadataToReact({
      title: 'Full Page',
      description: 'Full description',
      openGraph: { title: 'OG' },
      twitter: { card: 'summary' },
    });

    expect(nodes).toEqual([
      <title key="metadata-title">Full Page</title>,
      <meta key="metadata-meta-1" name="description" content="Full description" />,
      <meta key="metadata-meta-2" property="og:title" content="OG" />,
      <meta key="metadata-meta-3" name="twitter:card" content="summary" />,
    ]);
  });
});
