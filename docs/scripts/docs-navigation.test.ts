import { LATEST_VERSION } from '../constants/versions.js';
import { buildDocsNavigation, buildNavIndexFrom, normalizeNavKey } from './docs-navigation.ts';

function pages(prefix: string, count: number) {
  return Array.from({ length: count }, (_, i) => ({
    type: 'page' as const,
    name: `Page ${i}`,
    href: `${prefix}/page-${i}`,
  }));
}

const index = buildNavIndexFrom([
  {
    area: 'eas',
    nodes: [
      {
        type: 'section',
        name: '',
        children: [{ type: 'page', name: 'Overview', href: '/eas/overview' }],
      },
      {
        type: 'section',
        name: 'EAS Workflows',
        children: [
          { type: 'page', name: 'Introduction', href: '/eas/workflows/introduction' },
          { type: 'page', name: 'Get started', href: '/eas/workflows/get-started' },
          { type: 'page', name: 'Limitations', href: '/eas/workflows/limitations' },
          {
            type: 'group',
            name: 'Examples',
            children: [
              { type: 'page', name: 'E2E tests', href: '/eas/workflows/examples/e2e-tests' },
              { type: 'page', name: 'Deploy', href: '/eas/workflows/examples/deploy' },
            ],
          },
          // External links must be ignored.
          { type: 'page', name: 'External', href: 'https://example.com' },
        ],
      },
      // A large NON-reference section: must still list (trimming is reference-only).
      { type: 'section', name: 'Big EAS', children: pages('/eas/big', 40) },
    ],
  },
  {
    area: 'reference',
    versionKey: 'v55.0.0',
    nodes: [
      // Large reference section: must trim.
      { type: 'section', name: 'Expo SDK', children: pages('/versions/v55.0.0/sdk', 40) },
      // Small reference section: must list.
      {
        type: 'section',
        name: 'Configuration files',
        children: [
          { type: 'page', name: 'app.json', href: '/versions/v55.0.0/config/app' },
          { type: 'page', name: 'metro.config.js', href: '/versions/v55.0.0/config/metro' },
        ],
      },
    ],
  },
  {
    area: 'reference',
    versionKey: 'latest',
    nodes: [{ type: 'section', name: 'Expo SDK', children: pages('/versions/latest/sdk', 40) }],
  },
]);

const navFor = (pathname: string) => buildDocsNavigation(pathname, index);

describe('normalizeNavKey', () => {
  it('adds a leading slash, drops trailing slashes, and maps empty to root', () => {
    expect(normalizeNavKey('/a/b/')).toBe('/a/b');
    expect(normalizeNavKey('a/b')).toBe('/a/b');
    expect(normalizeNavKey('/')).toBe('/');
    expect(normalizeNavKey('')).toBe('/');
  });
});

describe('buildDocsNavigation', () => {
  it('renders a section page with breadcrumb, siblings, and the current-page marker', () => {
    const block = navFor('/eas/workflows/get-started/');
    expect(block).toBe(
      [
        '<DocsNavigation>',
        'You are here: EAS > EAS Workflows',
        'Pages in this section:',
        '- Introduction',
        '- Get started (this page)',
        '- Limitations',
        'Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)',
        '</DocsNavigation>',
        '',
      ].join('\n')
    );
  });

  it('lists only the immediate container and ignores external links', () => {
    const block = navFor('/eas/workflows/get-started/') as string;
    expect(block).not.toContain('E2E tests');
    expect(block).not.toContain('https://example.com');
  });

  it('uses the immediate group for a nested page, including it in the breadcrumb', () => {
    const block = navFor('/eas/workflows/examples/e2e-tests') as string;
    expect(block).toContain('You are here: EAS > EAS Workflows > Examples');
    expect(block).toContain('- E2E tests (this page)');
    expect(block).toContain('- Deploy');
    expect(block).not.toContain('- Introduction');
  });

  it('omits a title-less section from the breadcrumb', () => {
    const block = navFor('/eas/overview') as string;
    expect(block).toContain('You are here: EAS\n');
    expect(block).toContain('- Overview (this page)');
  });

  it('trims a large reference section to breadcrumb + count', () => {
    const block = navFor('/versions/v55.0.0/sdk/page-0') as string;
    expect(block).toContain(
      'You are here: Reference (v55.0.0) > Expo SDK (40 pages in this section)'
    );
    expect(block).not.toContain('Pages in this section:');
    expect(block).not.toMatch(/^- /m);
    expect(block).toContain('Full documentation tree: [llms.txt](https://docs.expo.dev/llms.txt)');
  });

  it('lists a small reference section instead of trimming', () => {
    const block = navFor('/versions/v55.0.0/config/app') as string;
    expect(block).toContain('You are here: Reference (v55.0.0) > Configuration files');
    expect(block).toContain('- app.json (this page)');
    expect(block).toContain('- metro.config.js');
  });

  it('does not trim a large non-reference section', () => {
    const block = navFor('/eas/big/page-0') as string;
    expect(block).toContain('You are here: EAS > Big EAS');
    expect(block).toContain('Pages in this section:');
  });

  it('resolves the latest version segment to the real version label', () => {
    const block = navFor('/versions/latest/sdk/page-0') as string;
    expect(block).toContain(`You are here: Reference (${LATEST_VERSION}) > Expo SDK`);
  });

  it('is insensitive to a trailing slash', () => {
    expect(navFor('/eas/workflows/get-started')).toBe(navFor('/eas/workflows/get-started/'));
  });

  it('returns null for a page that is not in the navigation', () => {
    expect(navFor('/this/does/not/exist/')).toBeNull();
  });
});
