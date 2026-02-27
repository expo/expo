import { buildBreadcrumbListSchema, buildTechArticleSchema } from './structured-data';

describe(buildTechArticleSchema, () => {
  it('returns TechArticle with all fields', () => {
    const result = buildTechArticleSchema({
      title: 'Introduction to Expo Router',
      description: 'Expo Router is a file-based routing library.',
      modificationDate: '2026-01-15',
      url: 'https://docs.expo.dev/router/introduction/',
    });

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: 'Introduction to Expo Router',
      description: 'Expo Router is a file-based routing library.',
      dateModified: '2026-01-15',
      publisher: { '@type': 'Organization', name: 'Expo' },
      url: 'https://docs.expo.dev/router/introduction/',
    });
  });

  it('omits description when not provided', () => {
    const result = buildTechArticleSchema({
      title: 'Some page',
      url: 'https://docs.expo.dev/some-page/',
    });

    expect(result).not.toHaveProperty('description');
    expect(result.headline).toBe('Some page');
    expect(result.url).toBe('https://docs.expo.dev/some-page/');
  });

  it('omits dateModified when modificationDate is not provided', () => {
    const result = buildTechArticleSchema({
      title: 'Some page',
      description: 'A description.',
      url: 'https://docs.expo.dev/some-page/',
    });

    expect(result).not.toHaveProperty('dateModified');
    expect(result).toHaveProperty('description', 'A description.');
  });

  it('always includes publisher as Expo organization', () => {
    const result = buildTechArticleSchema({
      title: 'Any page',
      url: 'https://docs.expo.dev/any/',
    });

    expect(result.publisher).toEqual({ '@type': 'Organization', name: 'Expo' });
  });
});

describe(buildBreadcrumbListSchema, () => {
  it('returns null for empty array', () => {
    expect(buildBreadcrumbListSchema([])).toBeNull();
  });

  it('returns null for single item', () => {
    expect(buildBreadcrumbListSchema([{ name: 'Home' }])).toBeNull();
  });

  it('returns valid BreadcrumbList for 2 items', () => {
    const result = buildBreadcrumbListSchema([
      { name: 'Get started', url: 'https://docs.expo.dev/get-started' },
      { name: 'Introduction' },
    ]);

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Get started',
          item: 'https://docs.expo.dev/get-started',
        },
        { '@type': 'ListItem', position: 2, name: 'Introduction' },
      ],
    });
  });

  it('returns valid BreadcrumbList for 3 items', () => {
    const result = buildBreadcrumbListSchema([
      { name: 'Develop', url: 'https://docs.expo.dev/develop' },
      { name: 'User interface', url: 'https://docs.expo.dev/develop/user-interface' },
      { name: 'Fonts' },
    ]);

    expect(result?.itemListElement).toHaveLength(3);
    expect(result?.itemListElement[2]).toEqual({
      '@type': 'ListItem',
      position: 3,
      name: 'Fonts',
    });
  });

  it('omits item property when url is undefined', () => {
    const result = buildBreadcrumbListSchema([
      { name: 'Section', url: 'https://docs.expo.dev/section' },
      { name: 'Page' },
    ]);

    expect(result?.itemListElement[0]).toHaveProperty('item');
    expect(result?.itemListElement[1]).not.toHaveProperty('item');
  });

  it('sets sequential position numbers starting at 1', () => {
    const result = buildBreadcrumbListSchema([
      { name: 'A', url: 'https://example.com/a' },
      { name: 'B', url: 'https://example.com/b' },
      { name: 'C' },
    ]);

    const positions = result?.itemListElement.map((el: { position: number }) => el.position);
    expect(positions).toEqual([1, 2, 3]);
  });
});
