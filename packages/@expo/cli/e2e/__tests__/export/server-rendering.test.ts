/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  RUNTIME_EXPO_SERVE,
  RUNTIME_WORKERD,
  setupServer,
} from '../../utils/runtime';
import { findProjectFiles, getHtml } from '../utils';

runExportSideEffects();

describe('exports server', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_WORKERD], {
      fixtureName: 'static-rendering',
      export: {
        env: {
          E2E_ROUTER_ASYNC: '',
        },
        cliFlags: ['--source-maps'],
      },
      serve: {
        env: {
          TEST_SECRET_KEY: 'test-secret-key',
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it(`can serve up index html`, async () => {
      const html = getHtml(await server.fetchAsync('/').then((res) => res.text()));
      expect(html.querySelector('[data-testid="index-text"]')?.textContent).toEqual('Index');
    });

    it(`can serve up non-index html`, async () => {
      const html = getHtml(await server.fetchAsync('/styled').then((res) => res.text()));
      expect(html.querySelector('[data-testid="styled-text"]')?.textContent).toEqual('Hello World');
    });

    it.each([{ post: 'other' }, { post: 'welcome-to-the-universe' }])(
      `can serve up dynamically rendered html for post: $post`,
      async ({ post }) => {
        const html = getHtml(await server.fetchAsync(`/${post}`).then((res) => res.text()));
        expect(html.querySelector('[data-testid="post-text"]')?.textContent).toEqual(
          `Post: ${post}`
        );
      }
    );

    it(`gets a 404`, async () => {
      expect(await server.fetchAsync('/missing/route').then((res) => res.status)).toBe(404);
    });

    it('has expected files', async () => {
      const files = findProjectFiles(path.join(server.outputDir, 'server'));

      // In SSR mode, no HTML files are pre-rendered - they're rendered at request time
      const serverHtmlFiles = files.filter((f) => f.endsWith('.html'));
      expect(serverHtmlFiles.length).toEqual(0);

      // SSR-specific files SHOULD exist
      expect(files).toContain('_expo/server/render.js');
      expect(files).toContain('_expo/assets.json');
      expect(files).toContain('_expo/routes.json');
    });

    it('has source maps', async () => {
      const files = findProjectFiles(server.outputDir);

      const mapFiles = files.filter((file) => file?.endsWith('.map'));
      // SSR mode has both client bundle map and SSR render module map
      expect(mapFiles).toEqual(
        expect.arrayContaining([
          expect.stringMatching(/_expo\/static\/js\/web\/entry-.*\.map/),
          'server/_expo/server/render.js.map',
        ])
      );

      // Check client bundle source maps
      const clientMapFiles = mapFiles.filter((file) => file?.includes('client/'));
      for (const file of clientMapFiles) {
        const sourceMap = JSON.parse(fs.readFileSync(path.join(server.outputDir, file!), 'utf8'));
        expect(sourceMap.version).toBe(3);
        expect(sourceMap.sources).toEqual(
          expect.arrayContaining([
            '__prelude__',
            // NOTE: No `/Users/evanbacon/`...
            // NOTE(@kitten): We can slot in our own runtime here
            expect.pathMatching(
              new RegExp(
                [
                  '/node_modules/metro-runtime/src/polyfills/require.js',
                  '/@expo/cli/build/metro-require/require.js',
                ].join('|')
              )
            ),

            // NOTE: relative to the server root for optimal source map support
            expect.pathMatching(/\/apps\/router-e2e\/__e2e__\/static-rendering\/app\/index\.tsx/),
          ])
        );
      }

      // Check client bundle JS files have sourceMappingURL
      const clientJsFiles = files.filter(
        (file) => file?.endsWith('.js') && file?.includes('client/')
      );

      for (const file of clientJsFiles) {
        const jsBundle = fs.readFileSync(path.join(server.outputDir, file!), 'utf8');
        expect(jsBundle).toMatch(
          /^\/\/\# sourceMappingURL=\/_expo\/static\/js\/web\/entry-.*\.map$/gm
        );
        const mapFile = jsBundle.match(
          /^\/\/\# sourceMappingURL=(\/_expo\/static\/js\/web\/entry-.*\.map)$/m
        )?.[1];

        // The mapFile path is relative to the web root (e.g., /_expo/...), but files are under client/
        const mapFilePath = mapFile ? 'client' + mapFile : null;
        expect(mapFilePath && fs.existsSync(path.join(server.outputDir, mapFilePath))).toBe(true);
      }

      // Check server bundle source map
      // NOTE: Server bundles don't have an inline `sourceMappingURL` comment like client bundles.
      const serverMapFile = 'server/_expo/server/render.js.map';
      const serverSourceMap = JSON.parse(
        fs.readFileSync(path.join(server.outputDir, serverMapFile), 'utf8')
      );
      expect(serverSourceMap.version).toBe(3);
      expect(serverSourceMap.sources).toEqual(
        expect.arrayContaining([
          // Should contain `@expo/router-server` source files (node/ or build/)
          expect.pathMatching(/\/@expo\/router-server\//),
        ])
      );
    });

    it('can use environment variables', async () => {
      const indexHtml = getHtml(await server.fetchAsync('/').then((res) => res.text()));

      const queryMeta = (name: string) =>
        indexHtml.querySelector(`html > head > meta[name="${name}"]`)?.attributes.content;

      // Injected in app/+html.js
      expect(queryMeta('expo-e2e-public-env-var')).toEqual('foobar');
      // non-public env vars are injected during SSR
      expect(queryMeta('expo-e2e-private-env-var')).toEqual('not-public-value');

      // Injected in app/_layout.js
      expect(queryMeta('expo-e2e-public-env-var-client')).toEqual('foobar');
      // non-public env vars are injected during SSR
      expect(queryMeta('expo-e2e-private-env-var-client')).toEqual('not-public-value');

      indexHtml
        .querySelectorAll('script')
        .filter((script) => !!script.attributes.src)
        .forEach((script) => {
          const jsBundle = fs.readFileSync(
            path.join(server.outputDir, 'client', script.attributes.src),
            'utf8'
          );

          // Ensure the bundle is valid
          expect(jsBundle).toMatch('__BUNDLE_START_TIME__');
          // Ensure the non-public env var is not included in the bundle
          expect(jsBundle).not.toMatch('not-public-value');
        });
    });

    it('injects hydration assets into SSR response', async () => {
      const html = await server.fetchAsync('/').then((res) => res.text());

      expect(html).toMatch(/<script src="\/_expo\/static\/js\/web\/entry-.*\.js" defer><\/script>/);
    });

    it('SSR styles are injected', async () => {
      const indexHtml = getHtml(await server.fetchAsync('/').then((res) => res.text()));

      expect(indexHtml.querySelectorAll('html > head > style')?.length).toBe(
        // React Native and Expo resets
        3
      );
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

    it('extracts CSS', async () => {
      // Unfortunately, the CSS is injected in every page for now since we don't have bundle splitting.
      const indexHtml = getHtml(await server.fetchAsync('/').then((res) => res.text()));

      const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
        // Fonts are tested elsewhere
        return link.attributes.as !== 'font';
      });
      expect(links.length).toBe(
        // Global CSS, CSS Module
        4
      );

      const linkStrings = links.map((l) => l.toString());

      expect(linkStrings).toEqual(
        expect.arrayContaining([
          // Global CSS (preload + stylesheet)
          expect.stringMatching(
            /<link rel="preload" href="\/_expo\/static\/css\/global-(?<md5>[0-9a-fA-F]{32})\.css" as="style">/
          ),
          expect.stringMatching(
            /<link rel="stylesheet" href="\/_expo\/static\/css\/global-(?<md5>[0-9a-fA-F]{32})\.css">/
          ),
          // Example test CSS module (preload + stylesheet)
          expect.stringMatching(
            /<link rel="preload" href="\/_expo\/static\/css\/test\.module-(?<md5>[0-9a-fA-F]{32})\.css" as="style">/
          ),
          expect.stringMatching(
            /<link rel="stylesheet" href="\/_expo\/static\/css\/test\.module-(?<md5>[0-9a-fA-F]{32})\.css">/
          ),
        ])
      );

      // Ensure the global CSS file is still generated
      const globalPreload = links.find((l) => /global-.*\.css/.test(l.attributes.href!));
      expect(globalPreload).toBeDefined();
      if (globalPreload) {
        expect(
          fs.readFileSync(
            path.join(server.outputDir, 'client', globalPreload.attributes.href),
            'utf-8'
          )
        ).toMatchInlineSnapshot(`"div{background:#0ff}"`);
      }

      // CSS Module
      expect(
        fs.readFileSync(path.join(server.outputDir, 'client', links[2].attributes.href), 'utf-8')
      ).toMatchInlineSnapshot(`".HPV33q_text{color:#1e90ff}"`);

      const styledHtml = getHtml(await server.fetchAsync('/styled').then((res) => res.text()));

      // Ensure the atomic CSS class is used
      expect(
        styledHtml.querySelector('html > body div[data-testid="styled-text"]')?.attributes.class
      ).toMatch('HPV33q_text');
    });

    it('extracts fonts', async () => {
      const indexHtml = getHtml(await server.fetchAsync('/').then((res) => res.text()));

      const links = indexHtml.querySelectorAll('html > head > link[as="font"]');
      expect(links.length).toBe(1);
      expect(links[0].attributes.href).toBe(
        '/assets/__e2e__/static-rendering/sweet.7c9263d3cffcda46ff7a4d9c00472c07.ttf'
      );

      expect(links[0].toString()).toMatch(
        /<link rel="preload" href="\/assets\/__e2e__\/static-rendering\/sweet\.[a-zA-Z0-9]{32}\.ttf" as="font" crossorigin="" >/
      );

      expect(
        fs.readFileSync(
          path.join(server.outputDir, 'client', links[0].attributes.href.replace(/\?.*$/, '')),
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
      const page = await server.fetchAsync('/').then((res) => res.text());

      expect(page).toContain('<meta name="custom-value" content="value"/>');

      // Root element
      expect(page).toContain('<div id="root">');

      const sanitized = page.replace(
        /<script src="\/_expo\/static\/js\/web\/.*" defer>/,
        '<script src="/_expo/static/js/web/[mock].js" defer>'
      );
      expect(sanitized).toMatchSnapshot();

      expect(
        getHtml(await server.fetchAsync('/about').then((res) => res.text())).querySelector(
          'html > head > meta[name="expo-e2e-pathname"]'
        )?.attributes.content
      ).toBe('/about');

      expect(
        getHtml(page).querySelector('html > head > meta[name="expo-e2e-pathname"]')?.attributes
          .content
      ).toBe('/');

      expect(
        getHtml(
          await server.fetchAsync('/welcome-to-the-universe').then((res) => res.text())
        ).querySelector('html > head > meta[name="expo-e2e-pathname"]')?.attributes.content
      ).toBe('/welcome-to-the-universe');
    });

    it('supports nested static head values', async () => {
      // <title>About | Website</title>
      // <meta name="description" content="About page" />
      const about = getHtml(await server.fetchAsync('/about').then((res) => res.text()));

      expect(about.querySelector('html > body div[data-testid="content"]')?.innerText).toBe(
        'About'
      );
      expect(about.querySelector('html > head > title')?.innerText).toBe('About | Website');
      expect(
        about.querySelector('html > head > meta[name="description"]')?.attributes.content
      ).toBe('About page');
      expect(
        // Nested from app/_layout.js
        about.querySelector('html > head > meta[name="expo-nested-layout"]')?.attributes.content
      ).toBe('TEST_VALUE');

      expect(
        // Other routes have the nested layout value
        getHtml(
          await server.fetchAsync('/welcome-to-the-universe').then((r) => r.text())
        ).querySelector('html > head > meta[name="expo-nested-layout"]')?.attributes.content
      ).toBe('TEST_VALUE');
    });
  });
});
