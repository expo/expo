import { pushName, pushProperty, pushLink } from '../tag';
import type { MetadataTag } from '../types';

describe(pushName, () => {
  it('pushes a <meta> tag with name attribute', () => {
    const tags: MetadataTag[] = [];
    pushName(tags, 'description', 'A description');

    expect(tags).toEqual([
      { tagName: 'meta', attributes: { name: 'description', content: 'A description' } },
    ]);
  });

  it('does not push when value is undefined', () => {
    const tags: MetadataTag[] = [];
    pushName(tags, 'description', undefined);

    expect(tags).toEqual([]);
  });

  it('does not push when value is empty string', () => {
    const tags: MetadataTag[] = [];
    pushName(tags, 'description', '');

    expect(tags).toEqual([]);
  });
});

describe(pushProperty, () => {
  it('pushes a <meta> tag with property attribute', () => {
    const tags: MetadataTag[] = [];
    pushProperty(tags, 'og:title', 'OG Title');

    expect(tags).toEqual([
      { tagName: 'meta', attributes: { property: 'og:title', content: 'OG Title' } },
    ]);
  });

  it('does not push when value is undefined', () => {
    const tags: MetadataTag[] = [];
    pushProperty(tags, 'og:title', undefined);

    expect(tags).toEqual([]);
  });
});

describe(pushLink, () => {
  it('pushes a <link> tag with attributes', () => {
    const tags: MetadataTag[] = [];
    pushLink(tags, { rel: 'canonical', href: 'https://example.dev' });

    expect(tags).toEqual([
      { tagName: 'link', attributes: { rel: 'canonical', href: 'https://example.dev' } },
    ]);
  });

  it('filters out undefined and empty attribute values', () => {
    const tags: MetadataTag[] = [];
    pushLink(tags, {
      rel: 'alternate',
      href: 'https://example.dev',
      hreflang: undefined,
      media: '',
    });

    expect(tags).toEqual([
      { tagName: 'link', attributes: { rel: 'alternate', href: 'https://example.dev' } },
    ]);
  });

  it('does not push when all attributes are empty', () => {
    const tags: MetadataTag[] = [];
    pushLink(tags, { rel: '', href: '' });

    expect(tags).toEqual([]);
  });
});
