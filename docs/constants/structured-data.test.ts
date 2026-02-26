import { buildBreadcrumbListSchema, buildFAQPageSchema } from './structured-data';

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

describe(buildFAQPageSchema, () => {
  it('returns null for empty array', () => {
    expect(buildFAQPageSchema([])).toBeNull();
  });

  it('returns valid FAQPage for a single item', () => {
    const result = buildFAQPageSchema([
      { question: 'What is Expo?', answer: 'A framework for React Native.' },
    ]);

    expect(result).toEqual({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'What is Expo?',
          acceptedAnswer: { '@type': 'Answer', text: 'A framework for React Native.' },
        },
      ],
    });
  });

  it('returns valid FAQPage for multiple items', () => {
    const result = buildFAQPageSchema([
      { question: 'Q1?', answer: 'A1' },
      { question: 'Q2?', answer: 'A2' },
      { question: 'Q3?', answer: 'A3' },
    ]);

    expect(result?.mainEntity).toHaveLength(3);
    expect(result?.mainEntity[1]).toEqual({
      '@type': 'Question',
      name: 'Q2?',
      acceptedAnswer: { '@type': 'Answer', text: 'A2' },
    });
  });

  it('preserves answer text as-is', () => {
    const answer = 'Use `npx expo install` to add packages.\nSee https://docs.expo.dev for more.';
    const result = buildFAQPageSchema([{ question: 'How?', answer }]);

    expect(result?.mainEntity[0].acceptedAnswer.text).toBe(answer);
  });
});
