import { hasDynamicData, normalizePath, shouldShowMarkdownActions } from './paths';

describe(normalizePath, () => {
  it('strips trailing slashes', () => {
    expect(normalizePath('/additional-resources/')).toBe('/additional-resources');
  });

  it('strips query strings', () => {
    expect(normalizePath('/additional-resources/?foo=bar')).toBe('/additional-resources');
  });

  it('strips hash fragments', () => {
    expect(normalizePath('/additional-resources/#talks')).toBe('/additional-resources');
    expect(normalizePath('/bare/upgrade/#anchor')).toBe('/bare/upgrade');
  });

  it('handles empty and root paths', () => {
    expect(normalizePath('')).toBe('');
    expect(normalizePath('/')).toBe('/');
  });
});

describe(hasDynamicData, () => {
  it('matches dynamic-data paths regardless of trailing slash', () => {
    expect(hasDynamicData('/additional-resources')).toBe(true);
    expect(hasDynamicData('/additional-resources/')).toBe(true);
  });

  it('matches dynamic-data paths when the client URL carries a hash', () => {
    expect(hasDynamicData('/additional-resources/#talks')).toBe(true);
  });

  it('does not match regular pages', () => {
    expect(hasDynamicData('/guides/overview/')).toBe(false);
    expect(hasDynamicData('/guides/overview/#section')).toBe(false);
  });
});

describe(shouldShowMarkdownActions, () => {
  it('agrees between server and client paths for the same page', () => {
    const server = shouldShowMarkdownActions({ path: '/additional-resources/' });
    const client = shouldShowMarkdownActions({ path: '/additional-resources/#talks' });
    expect(client).toBe(server);
    expect(client).toBe(false);
  });

  it('hides actions for package pages', () => {
    expect(shouldShowMarkdownActions({ packageName: 'expo-video', path: '/guides/x/' })).toBe(
      false
    );
  });
});
