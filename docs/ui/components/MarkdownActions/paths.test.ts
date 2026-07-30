import {
  getVersionedMarkdownPath,
  hasDynamicData,
  normalizePath,
  shouldShowMarkdownActions,
} from './paths';

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

describe(getVersionedMarkdownPath, () => {
  it('resolves the pair markdown path from the upgrade helper query', () => {
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=52&toSdk=57')).toBe(
      '/bare/upgrade/52-to-57/index.md'
    );
  });

  it('resolves without a trailing slash and with a hash fragment', () => {
    expect(getVersionedMarkdownPath('/bare/upgrade?fromSdk=52&toSdk=57')).toBe(
      '/bare/upgrade/52-to-57/index.md'
    );
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=52&toSdk=57#packagejson')).toBe(
      '/bare/upgrade/52-to-57/index.md'
    );
  });

  it('allows unversioned as the target version', () => {
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=52&toSdk=unversioned')).toBe(
      '/bare/upgrade/52-to-unversioned/index.md'
    );
  });

  it('returns null when either version is missing', () => {
    expect(getVersionedMarkdownPath('/bare/upgrade/')).toBeNull();
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=52')).toBeNull();
    expect(getVersionedMarkdownPath('/bare/upgrade/?toSdk=57')).toBeNull();
  });

  it('returns null on other pages carrying the same query', () => {
    expect(getVersionedMarkdownPath('/guides/overview/?fromSdk=52&toSdk=57')).toBeNull();
  });

  it('rejects versions that are not plain numbers or unversioned', () => {
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=..%2F52&toSdk=57')).toBeNull();
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=52abc&toSdk=57')).toBeNull();
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=&toSdk=57')).toBeNull();
  });

  it('rejects pairs that do not upgrade to a newer version', () => {
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=57&toSdk=52')).toBeNull();
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=52&toSdk=52')).toBeNull();
    expect(getVersionedMarkdownPath('/bare/upgrade/?fromSdk=unversioned&toSdk=57')).toBeNull();
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

  it('hides actions on the upgrade helper without a version pair', () => {
    expect(shouldShowMarkdownActions({ path: '/bare/upgrade/' })).toBe(false);
    expect(shouldShowMarkdownActions({ path: '/bare/upgrade/?fromSdk=57&toSdk=52' })).toBe(false);
  });

  it('shows actions on the upgrade helper once a version pair is selected', () => {
    expect(shouldShowMarkdownActions({ path: '/bare/upgrade/?fromSdk=52&toSdk=57' })).toBe(true);
  });

  it('keeps package pages hidden even with a version pair selected', () => {
    expect(
      shouldShowMarkdownActions({
        packageName: 'expo-video',
        path: '/bare/upgrade/?fromSdk=52&toSdk=57',
      })
    ).toBe(false);
  });
});
