import { parseRedirects, validateRedirectTargets } from './redirects.ts';

const REDIRECTS_FILE = `# Old redirects
/distribution/building-standalone-apps /build/setup 301

# EAS splats
/eas/build/* /build/:splat 301
/versions/v50.0.0/* /versions/latest/:splat 301
/*.md /:splat/index.md 301
/chained /distribution/building-standalone-apps 301
/dangling /this/page/is/gone 301
/external-target https://expo.dev/eas 301
/hash-target /build/setup/#usage 301
/query-target /build/setup/?tab=eas 301
/llms-full.txt /llms.txt 301
`;

const PAGES = new Set(['/', '/build/setup', '/guides/overview', '/sdk/notifications']);

const FILES = new Set(['/llms.txt', '/static/images/logo.png']);

describe(parseRedirects, () => {
  it('parses rules and skips comments and blank lines', () => {
    const { literal } = parseRedirects(REDIRECTS_FILE);
    expect(literal.get('/distribution/building-standalone-apps')).toBe('/build/setup');
    expect(literal.has('# Old redirects')).toBe(false);
  });

  it('separates splat rules from literal rules', () => {
    const { literal, splats } = parseRedirects(REDIRECTS_FILE);
    expect(literal.has('/eas/build/*')).toBe(false);
    expect(splats.map(rule => rule.source)).toEqual([
      '/eas/build/*',
      '/versions/v50.0.0/*',
      '/*.md',
    ]);
  });

  it('treats mid-path splats as splat rules', () => {
    const { literal, splats } = parseRedirects('/*.md /:splat/index.md 301');
    expect(literal.size).toBe(0);
    expect(splats).toHaveLength(1);
  });

  it('accepts rules without a status code', () => {
    const { literal } = parseRedirects('/old /new');
    expect(literal.get('/old')).toBe('/new');
  });

  it('normalizes trailing slashes in sources and destinations', () => {
    const { literal } = parseRedirects('/old/ /new/ 301');
    expect(literal.get('/old')).toBe('/new');
  });
});

describe(validateRedirectTargets, () => {
  const redirects = parseRedirects(REDIRECTS_FILE);
  const dangling = validateRedirectTargets(redirects, PAGES, FILES);

  it('accepts destinations that are live pages', () => {
    expect(dangling.map(rule => rule.source)).not.toContain(
      '/distribution/building-standalone-apps'
    );
  });

  it('accepts destinations that chain into another redirect', () => {
    expect(dangling.map(rule => rule.source)).not.toContain('/chained');
  });

  it('accepts destinations that are static files', () => {
    expect(dangling.map(rule => rule.source)).not.toContain('/llms-full.txt');
  });

  it('skips external and splat destinations', () => {
    const sources = dangling.map(rule => rule.source);
    expect(sources).not.toContain('/external-target');
    expect(sources).not.toContain('/eas/build/*');
  });

  it('reports destinations that resolve nowhere', () => {
    expect(dangling.map(rule => rule.source)).toContain('/dangling');
  });

  it('strips hash and query from destinations before checking', () => {
    const sources = dangling.map(rule => rule.source);
    expect(sources).not.toContain('/hash-target');
    expect(sources).not.toContain('/query-target');
  });
});
