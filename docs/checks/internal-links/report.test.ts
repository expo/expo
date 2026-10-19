import { composeLinkReport, composePageView } from './report.ts';
import { type LinkReport, type PageIssue } from './scan.ts';

const REPORT_DATE = new Date('2026-07-27T08:00:00Z');

function linkReport(overrides: Partial<LinkReport> = {}): LinkReport {
  return {
    generatedAt: '2026-07-27T08:00:00.000Z',
    pagesScanned: 1773,
    internalLinksChecked: 276864,
    broken: [],
    brokenAnchors: [
      {
        target: '/versions/v57.0.0/sdk/router#state',
        count: 10,
        pages: ['/versions/v57.0.0/sdk/router'],
        pageCount: 1,
      },
      {
        target: '/versions/v56.0.0/sdk/router#state',
        count: 10,
        pages: ['/versions/v56.0.0/sdk/router'],
        pageCount: 1,
      },
      {
        target: '/more/release-statuses#experimental',
        count: 26,
        pages: ['/guides/server-components'],
        pageCount: 21,
      },
    ],
    viaRedirect: [
      {
        target: '/guides/linking',
        count: 9,
        pages: ['/versions/latest/sdk/linking'],
        pageCount: 6,
      },
    ],
    danglingRedirects: [
      { source: '/expokit/overview', destination: '/archive/glossary', splat: false },
    ],
    ...overrides,
  };
}

describe(composeLinkReport, () => {
  it('leads the title with anchors and dangling redirects', () => {
    const { title } = composeLinkReport(linkReport(), { date: REPORT_DATE });
    expect(title).toBe('Docs link report: 2 broken anchors, 1 dangling redirect (Jul 27, 2026)');
  });

  it('leads the title with broken pages when any ship', () => {
    const { title } = composeLinkReport(
      linkReport({ broken: [{ target: '/gone', count: 2, pages: ['/home'], pageCount: 1 }] }),
      { date: REPORT_DATE }
    );
    expect(title).toMatch(/^Docs link report: 1 broken page/);
  });

  it('groups anchors by owning page with version copies collapsed', () => {
    const { body } = composeLinkReport(linkReport(), { date: REPORT_DATE });
    expect(body).toContain('**`/versions/*/sdk/router`** (2 versions) — 1 dead anchor');
    expect(body).toContain('`#state`');
    expect(body).not.toContain('/versions/v56.0.0/sdk/router');
  });

  it('marks self-linked anchors instead of listing the page as its own source', () => {
    const { body } = composeLinkReport(linkReport(), { date: REPORT_DATE });
    expect(body).toContain('all self-links');
  });

  it('lists every source page for cross-page anchors', () => {
    const { body } = composeLinkReport(linkReport(), { date: REPORT_DATE });
    expect(body).toContain('**`/more/release-statuses`** — 1 dead anchor:');
    expect(body).toContain('Linked from 1 page: `/guides/server-components`');
  });

  it('splits anchors into SDK and non-SDK fix sections', () => {
    const { body } = composeLinkReport(linkReport(), { date: REPORT_DATE });
    expect(body).toContain(
      '#### SDK/API reference pages — fix in package TSDoc, then regenerate data'
    );
    expect(body).toContain('#### Guides and other pages — fix the links or restore the heading');
  });

  it('includes every section with its totals', () => {
    const { body } = composeLinkReport(linkReport(), { date: REPORT_DATE });
    expect(body).toContain('Broken page paths: 0');
    expect(body).toContain('Dangling redirects: 1');
    expect(body).toContain('### Broken anchors: 2 distinct dead anchors on 2 pages');
    expect(body).toContain('/expokit/overview');
    expect(body).toContain('/guides/linking');
  });

  it('links the workflow run when a run url is provided', () => {
    const { body } = composeLinkReport(linkReport(), {
      date: REPORT_DATE,
      runUrl: 'https://github.com/expo/expo/actions/runs/1',
    });
    expect(body).toContain('https://github.com/expo/expo/actions/runs/1');
  });

  it('reports findings present', () => {
    expect(composeLinkReport(linkReport(), { date: REPORT_DATE }).hasFindings).toBe(true);
  });

  it('reports no findings when paths, redirects, and anchors are clean', () => {
    const clean = linkReport({ brokenAnchors: [], danglingRedirects: [] });
    expect(composeLinkReport(clean, { date: REPORT_DATE }).hasFindings).toBe(false);
  });
});

describe(composePageView, () => {
  const issuesByPage = new Map<string, PageIssue[]>([
    [
      '/guides/server-components',
      [
        {
          kind: 'anchor',
          target: '/more/release-statuses',
          hash: 'experimental',
          self: false,
          count: 3,
        },
        { kind: 'via-redirect', target: '/develop/development-builds/create-a-build', count: 1 },
      ],
    ],
    [
      '/versions/latest/sdk/router',
      [
        {
          kind: 'anchor',
          target: '/versions/latest/sdk/router',
          hash: 'state',
          self: true,
          count: 1,
        },
        { kind: 'broken', target: '/versions/latest/sdk/router/index', count: 1 },
      ],
    ],
  ]);
  const dangling = [
    { source: '/expokit/overview', destination: '/archive/glossary', splat: false },
  ];

  it('lists every issue under its source page', () => {
    const view = composePageView(issuesByPage, dangling);
    expect(view.indexOf('/guides/server-components')).toBeGreaterThanOrEqual(0);
    expect(view.indexOf('/more/release-statuses#experimental')).toBeGreaterThan(
      view.indexOf('/guides/server-components')
    );
    expect(view).toContain('/develop/development-builds/create-a-build');
  });

  it('marks how many links share a repeated issue', () => {
    const view = composePageView(issuesByPage, dangling);
    expect(view).toContain('/more/release-statuses#experimental (3 links)');
    expect(view).not.toContain('(1 link)');
  });

  it('renders self anchors with the hash only', () => {
    const view = composePageView(issuesByPage, dangling);
    expect(view).toContain('#state (self)');
    expect(view).not.toContain('/versions/latest/sdk/router#state');
  });

  it('includes dangling redirects ahead of page issues', () => {
    const view = composePageView(issuesByPage, dangling);
    expect(view.indexOf('/expokit/overview')).toBeLessThan(
      view.indexOf('/guides/server-components')
    );
    expect(view).toContain('/archive/glossary');
  });

  it('returns an empty string when there is nothing to show', () => {
    expect(composePageView(new Map(), [])).toBe('');
  });
});
