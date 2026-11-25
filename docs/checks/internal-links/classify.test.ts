import { classifyHref, type ValidSets } from './classify.ts';
import { pagePathFromHtmlFile } from './paths.ts';
import { parseRedirects } from './redirects.ts';

const REDIRECTS_FILE = `/distribution/building-standalone-apps /build/setup 301
/eas/build/* /build/:splat 301
/*.md /:splat/index.md 301
`;

function sets(overrides: Partial<ValidSets> = {}): ValidSets {
  return {
    pages: new Set(['/', '/build/setup', '/guides/overview', '/sdk/notifications']),
    files: new Set(['/static/images/logo.png', '/llms.txt']),
    redirects: parseRedirects(REDIRECTS_FILE),
    ...overrides,
  };
}

describe(classifyHref, () => {
  it('classifies a root-relative link to an existing page', () => {
    expect(classifyHref('/guides/overview', '/', sets()).kind).toBe('page');
  });

  it('ignores trailing slash, hash, and query', () => {
    expect(classifyHref('/guides/overview/?foo=1#bar', '/', sets()).kind).toBe('page');
  });

  it('classifies absolute docs.expo.dev links as internal', () => {
    expect(classifyHref('https://docs.expo.dev/guides/overview/', '/', sets()).kind).toBe('page');
  });

  it('classifies other origins as external', () => {
    expect(classifyHref('https://github.com/expo/expo', '/', sets()).kind).toBe('external');
  });

  it('classifies mailto links as external', () => {
    expect(classifyHref('mailto:support@expo.dev', '/', sets()).kind).toBe('external');
  });

  it('treats same-page hash links as self links carrying the hash', () => {
    expect(classifyHref('#usage', '/sdk/notifications', sets())).toEqual({
      kind: 'page',
      target: '/sdk/notifications',
      hash: 'usage',
    });
  });

  it('skips bare # links', () => {
    expect(classifyHref('#', '/sdk/notifications', sets()).kind).toBe('skip');
  });

  it('returns the hash on cross-page links', () => {
    expect(classifyHref('/guides/overview/#setup', '/', sets())).toEqual({
      kind: 'page',
      target: '/guides/overview',
      hash: 'setup',
    });
  });

  it('returns no hash on hashless page links', () => {
    expect(classifyHref('/guides/overview', '/', sets()).hash).toBeUndefined();
  });

  it('skips anchor validation for parameterized links', () => {
    const result = classifyHref(
      '/guides/overview?platform=android#variant-only-heading',
      '/',
      sets()
    );
    expect(result.kind).toBe('page');
    expect(result.hash).toBeUndefined();
  });

  it('still validates the path of parameterized links', () => {
    expect(classifyHref('/does/not/exist?platform=ios#section', '/', sets()).kind).toBe('broken');
  });

  it('classifies static assets present in the export', () => {
    expect(classifyHref('/static/images/logo.png', '/', sets()).kind).toBe('file');
  });

  it('accepts the .md worker gesture for an existing page', () => {
    expect(classifyHref('/sdk/notifications.md', '/sdk/notifications', sets()).kind).toBe('file');
  });

  it('flags links passing through a literal redirect', () => {
    const result = classifyHref('/distribution/building-standalone-apps', '/', sets());
    expect(result.kind).toBe('via-redirect');
  });

  it('flags links matching a splat redirect', () => {
    expect(classifyHref('/eas/build/introduction', '/', sets()).kind).toBe('via-redirect');
  });

  it('matches mid-path splats without swallowing unrelated paths', () => {
    expect(classifyHref('/old-page.md', '/', sets()).kind).toBe('via-redirect');
    expect(classifyHref('/this/does/not/exist', '/', sets()).kind).toBe('broken');
  });

  it('resolves relative links against the current page', () => {
    expect(classifyHref('overview', '/guides', sets()).kind).toBe('page');
  });

  it('classifies unknown internal paths as broken', () => {
    const result = classifyHref('/this/does/not/exist', '/', sets());
    expect(result.kind).toBe('broken');
    expect(result.target).toBe('/this/does/not/exist');
  });
});

describe(pagePathFromHtmlFile, () => {
  it('derives the site path from a nested index.html', () => {
    expect(pagePathFromHtmlFile('/x/out', '/x/out/guides/overview/index.html')).toBe(
      '/guides/overview'
    );
  });

  it('derives the root path', () => {
    expect(pagePathFromHtmlFile('/x/out', '/x/out/index.html')).toBe('/');
  });
});
