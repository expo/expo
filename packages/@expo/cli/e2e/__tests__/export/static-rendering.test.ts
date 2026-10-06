/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { expectSourceMapSection } from '../../utils/sourceMap';
import { findProjectFiles, getHtml, getPageHtml, getRouterE2ERoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('exports static', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'false',
          E2E_FAVICON: './assets/icon.png',
        },
      }
    );
  });

  describe('server', () => {
    const server = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    });

    beforeAll(async () => {
      // Start a server instance that we can test against then kill it.
      await server.startAsync([outputName]);
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    it(`can serve up index html`, async () => {
      const html = getHtml(await server.fetchAsync('/').then((res) => res.text()));
      expect(html.querySelector('[data-testid="index-text"]')?.textContent).toEqual('Index');
    });

    it(`can serve up non-index html`, async () => {
      const html = getHtml(await server.fetchAsync('/styled').then((res) => res.text()));
      expect(html.querySelector('[data-testid="styled-text"]')?.textContent).toEqual('Hello World');
    });

    ['other', 'welcome-to-the-universe'].forEach((post) => {});
    it.each([{ post: 'other' }, { post: 'welcome-to-the-universe' }])(
      `can serve up statically generated html for post: $post`,
      async ({ post }) => {
        const html = getHtml(await server.fetchAsync(`/${post}`).then((res) => res.text()));
        expect(html.querySelector('[data-testid="post-text"]')?.textContent).toEqual(
          `Post: ${post}`
        );
      }
    );

    it(`gets a 404`, async () => {
      expect(await server.fetchAsync('/missing-route').then((res) => res.status)).toBe(404);
    });

    it('injects `<link rel="icon">` into statically rendered pages', async () => {
      for (const route of ['/', '/styled', '/welcome-to-the-universe']) {
        const html = getHtml(await server.fetchAsync(route).then((res) => res.text()));
        const icon = html.querySelector('html > head > link[rel="icon"]');
        expect(icon).not.toBeNull();
        expect(icon?.attributes.href).toBe('/favicon.ico');
      }
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // Normal routes
    expect(files).toContain('about.html');
    expect(files).toContain('index.html');
    expect(files).toContain('styled.html');

    // generateStaticParams values
    expect(files).toContain('[post].html');
    expect(files).toContain('welcome-to-the-universe.html');
    expect(files).toContain('other.html');

    expect(files).toContain('_expo/.routes.json');

    // Generated from `web.favicon` in app config
    expect(files).toContain('favicon.ico');
  });

  it('has source maps', async () => {
    const files = findProjectFiles(outputDir);

    const mapFiles = files.filter((file) => file?.endsWith('.map'));
    expect(mapFiles).toEqual([expect.stringMatching(/_expo\/static\/js\/web\/entry-.*\.map/)]);

    for (const file of mapFiles) {
      // Ensure the bundle does not contain a source map reference
      const sourceMap = JSON.parse(fs.readFileSync(path.join(outputDir, file!), 'utf8'));
      expect(sourceMap.version).toBe(3);
      expect(sourceMap.sections).toEqual(
        expect.arrayContaining([
          expectSourceMapSection('__prelude__'),
          // NOTE: No `/Users/evanbacon/`...
          // NOTE(@kitten): We can slot in our own runtime here
          expectSourceMapSection(
            expect.pathMatching(
              new RegExp(
                [
                  '/node_modules/metro-runtime/src/polyfills/require.js',
                  '/@expo/cli/build/metro-require/require.js',
                ].join('|')
              )
            )
          ),

          // NOTE: relative to the server root for optimal source map support
          expectSourceMapSection(
            expect.pathMatching(/\/apps\/router-e2e\/__e2e__\/static-rendering\/app\/\[post\]\.tsx/)
          ),
        ])
      );
    }

    const jsFiles = files.filter((file) => file?.endsWith('.js'));

    for (const file of jsFiles) {
      // Ensure the bundle does not contain a source map reference
      const jsBundle = fs.readFileSync(path.join(outputDir, file!), 'utf8');
      expect(jsBundle).toMatch(
        /^\/\/\# sourceMappingURL=\/_expo\/static\/js\/web\/entry-.*\.map$/gm
      );
      const mapFile = jsBundle.match(
        /^\/\/\# sourceMappingURL=(\/_expo\/static\/js\/web\/entry-.*\.map)$/m
      )?.[1];

      expect(fs.existsSync(path.join(outputDir, mapFile!))).toBe(true);
    }
  });

  it('can use environment variables', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const queryMeta = (name: string) =>
      indexHtml.querySelector(`html > head > meta[name="${name}"]`)?.attributes.content;

    // Injected in app/+html.js
    expect(queryMeta('expo-e2e-public-env-var')).toEqual('foobar');
    // non-public env vars are injected during SSG
    expect(queryMeta('expo-e2e-private-env-var')).toEqual('not-public-value');

    // Generated by app/index.tsx
    expect(queryMeta('expo-e2e-public-env-var-client')).toEqual('foobar');
    // non-public env vars are injected during SSG
    expect(queryMeta('expo-e2e-private-env-var-client')).toEqual('not-public-value');

    indexHtml
      .querySelectorAll('script')
      .filter((script) => !!script.attributes.src)
      .forEach((script) => {
        const jsBundle = fs.readFileSync(path.join(outputDir, script.attributes.src ?? ''), 'utf8');

        // Ensure the bundle is valid
        expect(jsBundle).toMatch('__BUNDLE_START_TIME__');
        // Ensure the non-public env var is not included in the bundle
        expect(jsBundle).not.toMatch('not-public-value');
      });
  });

  it('static styles are injected', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');
    // The Expo style reset
    expect(indexHtml.querySelector('html > head > style#expo-reset')?.innerHTML).toEqual(
      expect.stringContaining(
        '#root,body,html{height:100%}body{overflow:hidden}#root{display:flex}'
      )
    );

    expect(
      indexHtml.querySelector('html > head > style#react-native-stylesheet')?.innerHTML
    ).toEqual(expect.stringContaining('[stylesheet-group="0"]{}'));
  });

  it('statically extracts CSS', async () => {
    // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const stylesheets = indexHtml.querySelectorAll('head link[rel="stylesheet"]');
    const stylesheetHrefs = stylesheets.map((link) => link.attributes.href);
    expect(stylesheetHrefs).toEqual([
      expect.stringMatching(/^\/_expo\/static\/css\/global-[0-9a-f]{32}\.css$/),
      expect.stringMatching(/^\/_expo\/static\/css\/test\.module-[0-9a-f]{32}\.css$/),
    ]);
    expect(
      indexHtml
        .querySelectorAll('head link[rel="preload"][as="style"]')
        .map((link) => link.attributes.href)
    ).toEqual(stylesheetHrefs);

    // Ensure the global CSS file is still generated
    const globalPreload = stylesheets.find((l) => /global-.*\.css/.test(l.attributes.href!));
    expect(globalPreload).toBeDefined();
    if (globalPreload) {
      expect(
        fs.readFileSync(path.join(outputDir, globalPreload.attributes.href ?? ''), 'utf-8')
      ).toMatchInlineSnapshot(`"div{background:#0ff}"`);
    }

    // CSS Module
    expect(
      fs.readFileSync(path.join(outputDir, stylesheets[1]?.attributes.href ?? ''), 'utf-8')
    ).toMatchInlineSnapshot(`".HPV33q_text{color:#1e90ff}"`);

    const styledHtml = await getPageHtml(outputDir, 'styled.html');

    // Ensure the atomic CSS class is used
    expect(
      styledHtml.querySelector('html > body div[data-testid="styled-text"]')?.attributes.class
    ).toMatch('HPV33q_text');
  });

  it('statically extracts fonts', async () => {
    // <style id="expo-generated-fonts" type="text/css">@font-face{font-family:sweet;src:url(/assets/__e2e__/static-rendering/sweet.ttf?platform=web&hash=7c9263d3cffcda46ff7a4d9c00472c07)}</style><link rel="preload" href="/assets/__e2e__/static-rendering/sweet.ttf?platform=web&hash=7c9263d3cffcda46ff7a4d9c00472c07" as="font" crossorigin="" />
    // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const links = indexHtml.querySelectorAll('html > head > link[as="font"]');
    expect(links.length).toBe(1);
    expect(links[0]?.attributes.href).toBe(
      '/assets/__e2e__/static-rendering/sweet.7c9263d3cffcda46ff7a4d9c00472c07.ttf'
    );

    expect(links[0]?.attributes).toMatchObject({ rel: 'preload', as: 'font', crossorigin: '' });
    expect(indexHtml.querySelector('style#expo-generated-fonts')?.textContent).toContain(
      '@font-face'
    );

    expect(
      fs.readFileSync(
        path.join(outputDir, links[0]?.attributes.href?.replace(/\?.*$/, '') ?? ''),
        'utf-8'
      )
    ).toBeDefined();

    // Ensure the font is used
    expect(indexHtml.querySelector('div[data-testid="index-text"]')?.attributes.style).toMatch(
      'font-family:sweet'
    );

    // TODO: This is broken with bundle splitting. Only fonts in the main layout are being statically extracted.
    // Fonts have proper splitting due to how they're loaded during static rendering, we should test
    // that certain fonts only show on the about page.
    // const aboutHtml = await getPageHtml(outputDir, 'about.html');

    // const aboutLinks = aboutHtml.querySelectorAll('html > head > link[as="font"]');
    // expect(aboutLinks.length).toBe(2);
    // expect(aboutLinks[1].attributes.href).toMatch(
    //   /react-native-vector-icons\/Fonts\/EvilIcons\.ttf/
    // );
  });

  it('supports usePathname in +html files', async () => {
    const page = await getPageHtml(outputDir, 'index.html');
    expect(page.querySelector('head meta[name="custom-value"]')?.attributes.content).toBe('value');
    expect(page.querySelector('body #root')).not.toBeNull();
    for (const script of page.querySelectorAll('script[src]')) {
      script.setAttribute('src', '/_expo/static/js/web/[mock].js');
    }
    for (const preload of page.querySelectorAll('link[as="script"]')) {
      preload.setAttribute('href', '/_expo/static/js/web/[mock].js');
    }
    expect(page.toString()).toMatchSnapshot();

    expect(
      (await getPageHtml(outputDir, 'about.html')).querySelector(
        'html > head > meta[name="expo-e2e-pathname"]'
      )?.attributes.content
    ).toBe('/about');

    expect(
      (await getPageHtml(outputDir, 'index.html')).querySelector(
        'html > head > meta[name="expo-e2e-pathname"]'
      )?.attributes.content
    ).toBe('/');

    expect(
      (await getPageHtml(outputDir, 'welcome-to-the-universe.html')).querySelector(
        'html > head > meta[name="expo-e2e-pathname"]'
      )?.attributes.content
    ).toBe('/welcome-to-the-universe');
  });

  it('renders generateMetadata in the initial head', async () => {
    // <title>About | Website</title>
    // <meta name="description" content="About page" />
    const about = await getPageHtml(outputDir, 'about.html');

    expect(about.querySelector('html > body div[data-testid="content"]')?.innerText).toBe('About');
    expect(about.querySelector('html > head > title')?.innerText).toBe('About | Website');
    expect(about.querySelector('html > head > meta[name="description"]')?.attributes.content).toBe(
      'About page'
    );

    // NOTE(@hassankhan): We'll re-enable these after landing generateMetadata in layouts
    // expect(
    //   // Nested from app/_layout.js
    //   about.querySelector('html > head > meta[name="expo-nested-layout"]')?.attributes.content
    // ).toBe('TEST_VALUE');
    // expect(
    //   // Other routes have the nested layout value
    //   (await getPageHtml(outputDir, 'welcome-to-the-universe.html')).querySelector(
    //     'html > head > meta[name="expo-nested-layout"]'
    //   )?.attributes.content
    // ).toBe('TEST_VALUE');
  });

  it('injects `generateMetadata()` result into the initial static HTML <head>', async () => {
    const page = await getPageHtml(outputDir, 'metadata.html');
    const head = page.querySelector('html > head');

    expect(page.querySelector('html > body [data-testid="metadata-text"]')?.innerText).toBe(
      'Metadata'
    );
    expect(head).not.toBeNull();

    const metadataHeadNodes = head!.childNodes
      .filter(
        (node: any) => node.rawTagName && ['title', 'meta'].includes(node.rawTagName as string)
      )
      .map((node) => node.toString());

    expect(metadataHeadNodes).toMatchSnapshot();
  });

  it('resolves async `generateMetadata()` with route params', async () => {
    const page = await getPageHtml(outputDir, 'metadata-async/123.html');

    expect(page.querySelector('html > body [data-testid="async-metadata-text"]')?.innerText).toBe(
      'Async Metadata'
    );
    expect(page.querySelector('html > head > title')?.innerText).toBe('Async Metadata 123');
    expect(page.querySelector('html > head > meta[name="description"]')?.attributes.content).toBe(
      'Async metadata for /metadata-async/123'
    );
  });
});

describe('exports static with a base path and split bundles', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-streaming';
  const outputDir = path.join(projectRoot, outputName);
  const baseUrl = '/one/two';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'static-rendering',
        E2E_FAVICON: './assets/icon.png',
        E2E_ROUTER_ASYNC: 'production',
        EXPO_E2E_BASE_PATH: baseUrl,
      },
    });
  });

  it('exports internal and user pages with split hydration bundles', () => {
    expect(findProjectFiles(outputDir)).toEqual(
      expect.arrayContaining([
        '+not-found.html',
        '_sitemap.html',
        'index.html',
        'suspense.html',
        'metadata.html',
        'metadata-async/123.html',
        expect.stringMatching(/_expo\/static\/js\/web\/suspense-[0-9a-f]{32}\.js/),
      ])
    );
  });

  it('preserves styles, fonts, favicon, and deferred bundles with a base path', async () => {
    const html = await getPageHtml(outputDir, 'index.html');
    expect(html.querySelector('head style#expo-reset')?.textContent).toContain('#root');
    expect(html.querySelector('head style#react-native-stylesheet')?.textContent).toContain(
      '[stylesheet-group="0"]'
    );
    expect(html.querySelector('style#expo-generated-fonts')?.textContent).toContain('@font-face');
    expect(html.querySelector('head link[rel="icon"]')?.attributes.href).toBe(
      `${baseUrl}/favicon.ico`
    );

    const assets = html.querySelectorAll('script[src], link[rel="stylesheet"], link[as="font"]');
    expect(html.querySelectorAll('script[src]').length).toBeGreaterThan(1);
    expect(html.querySelectorAll('link[rel="stylesheet"]').length).toBeGreaterThan(0);
    expect(html.querySelectorAll('link[as="font"]').length).toBeGreaterThan(0);
    for (const asset of assets) {
      const url = asset.attributes.src ?? asset.attributes.href;
      expect(url).toMatch(/^\/one\/two\//);
      expect(fs.existsSync(path.join(outputDir, url.slice(baseUrl.length)))).toBe(true);
      if (asset.tagName === 'SCRIPT') {
        expect(asset.hasAttribute('defer')).toBe(true);
      }
    }
  });
});
