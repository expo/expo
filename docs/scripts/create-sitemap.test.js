import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import createSitemap, { findRedirectStubUrls, pathSortedByPriority } from './create-sitemap.js';

const priorities = ['/get-started', '/guides', '/versions'];

const JS_STUB = `import redirect from '~/common/redirect';

export default redirect('/develop/development-builds/introduction');
`;

const MDX_STUB = `---
title: EAS Build
---

import Redirect from '~/components/plugins/Redirect';

<Redirect path="/build/introduction" />
`;

const MDX_CONTENT_WITH_REDIRECT_EXAMPLE = `---
title: Redirects
---

Use the [\`Redirect\`](https://docs.expo.dev/versions/latest/sdk/router/) component from \`expo-router\`:

\`\`\`tsx
import { Redirect } from 'expo-router';

export default function Page() {
  return <Redirect href="/about" />;
}
\`\`\`
`;

const MDX_CONTENT = `---
title: Overview
---

Real documentation content.
`;

let pagesDirectory;

beforeAll(() => {
  pagesDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'create-sitemap-test-'));

  const files = {
    'develop/index.js': JS_STUB,
    'build/index.mdx': MDX_STUB,
    'moved-page.mdx': MDX_STUB,
    'router/reference/redirects.mdx': MDX_CONTENT_WITH_REDIRECT_EXAMPLE,
    'guides/overview.mdx': MDX_CONTENT,
    'develop/development-builds/introduction.mdx': MDX_CONTENT,
  };

  for (const [file, contents] of Object.entries(files)) {
    const filePath = path.join(pagesDirectory, file);
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, contents);
  }
});

afterAll(() => {
  fs.rmSync(pagesDirectory, { recursive: true, force: true });
});

describe('findRedirectStubUrls', () => {
  test('detects index.js meta-refresh stubs', () => {
    expect(findRedirectStubUrls(pagesDirectory, ['/develop'])).toEqual(new Set(['/develop']));
  });

  test('detects mdx pages rendering the Redirect plugin', () => {
    expect(findRedirectStubUrls(pagesDirectory, ['/build', '/moved-page'])).toEqual(
      new Set(['/build', '/moved-page'])
    );
  });

  test('keeps content pages that only mention Redirect in code examples', () => {
    expect(findRedirectStubUrls(pagesDirectory, ['/router/reference/redirects'])).toEqual(
      new Set()
    );
  });

  test('keeps regular content pages, the root url, and unresolvable urls', () => {
    const urls = ['/guides/overview', '/develop/development-builds/introduction', '/', '/unknown'];
    expect(findRedirectStubUrls(pagesDirectory, urls)).toEqual(new Set());
  });
});

describe('createSitemap', () => {
  test('omits redirect stubs from the generated sitemap when pagesDirectory is set', async () => {
    const output = path.join(pagesDirectory, 'sitemap.xml');
    const urls = createSitemap({
      pathMap: {
        '/': {},
        '/develop': {},
        '/develop/development-builds/introduction': {},
        '/build': {},
        '/guides/overview': {},
      },
      domain: 'https://docs.expo.dev',
      output,
      pathsPriority: [],
      pathsHidden: [],
      pagesDirectory,
    });

    expect(urls).toEqual(['/', '/develop/development-builds/introduction/', '/guides/overview/']);

    const xml = await waitForSitemapFlush(output);
    expect(xml).toContain(
      '<loc>https://docs.expo.dev/develop/development-builds/introduction/</loc>'
    );
    expect(xml).not.toContain('<loc>https://docs.expo.dev/develop/</loc>');
    expect(xml).not.toContain('<loc>https://docs.expo.dev/build/</loc>');
  });
});

async function waitForSitemapFlush(filePath, timeoutMs = 2000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (fs.existsSync(filePath)) {
      const contents = fs.readFileSync(filePath, 'utf-8');
      if (contents.includes('</urlset>')) {
        return contents;
      }
    }
    await new Promise(resolve => setTimeout(resolve, 25));
  }
  throw new Error(`Sitemap was not fully written within ${timeoutMs}ms: ${filePath}`);
}

describe('pathSortedByPriority', () => {
  test('index page sorts first', () => {
    expect(pathSortedByPriority('/', '/guides/foo', priorities)).toBeLessThan(0);
    expect(pathSortedByPriority('/guides/foo', '/', priorities)).toBeGreaterThan(0);
  });

  test('two priority items sort by their priority order', () => {
    expect(pathSortedByPriority('/get-started/intro', '/guides/foo', priorities)).toBeLessThan(0);
    expect(
      pathSortedByPriority('/versions/latest', '/get-started/intro', priorities)
    ).toBeGreaterThan(0);
  });

  test('two non-priority items are treated as equal', () => {
    expect(pathSortedByPriority('/random/page', '/other/page', priorities)).toBe(0);
  });

  test('priority item sorts before non-priority item', () => {
    expect(pathSortedByPriority('/guides/foo', '/random/page', priorities)).toBeLessThan(0);
  });

  test('non-priority item sorts after priority item', () => {
    expect(pathSortedByPriority('/random/page', '/guides/foo', priorities)).toBeGreaterThan(0);
  });

  test('full sort produces correct order', () => {
    const paths = [
      '/random/page',
      '/versions/latest',
      '/',
      '/guides/foo',
      '/other/page',
      '/get-started/intro',
    ];
    const sorted = paths.sort((a, b) => pathSortedByPriority(a, b, priorities));
    expect(sorted).toEqual([
      '/',
      '/get-started/intro',
      '/guides/foo',
      '/versions/latest',
      '/random/page',
      '/other/page',
    ]);
  });
});
