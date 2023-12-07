/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { bin, ensurePortFreeAsync, getPageHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static-rendering with a custom base path', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering-asset-prefix';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await ensurePortFreeAsync(8081);

      const baseUrl = '/one/two';
      process.env.EXPO_E2E_BASE_PATH = baseUrl;
      await execa('node', [bin, 'export', '-p', 'web', '--clear', '--output-dir', outputName], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_E2E_BASE_PATH: baseUrl,
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'static-rendering',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      });
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it(
    'has expected files',
    async () => {
      // List output files with sizes for snapshotting.
      // This is to make sure that any changes to the output are intentional.
      // Posix path formatting is used to make paths the same across OSes.
      const files = klawSync(outputDir)
        .map((entry) => {
          if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
            return null;
          }
          return path.posix.relative(outputDir, entry.path);
        })
        .filter(Boolean);

      expect(
        files.find((file) => file?.match(/\_expo\/static\/js\/web\/index-.*\.js/))
      ).toBeDefined();

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
      expect(files).toContain('links.html');

      // generateStaticParams values
      expect(files).toContain('[post].html');
      expect(files).toContain('welcome-to-the-universe.html');
      expect(files).toContain('other.html');
    },
    5 * 1000
  );

  it(
    'writes assets with prefix',
    async () => {
      const indexHtml = await getPageHtml(outputDir, 'index.html');

      const jsFiles = indexHtml.querySelectorAll('script').map((script) => script.attributes.src);
      expect(jsFiles).toEqual([
        expect.stringMatching(/\/one\/two\/_expo\/static\/js\/web\/index-.*\.js/),
      ]);

      const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
        // Fonts are tested elsewhere
        return link.attributes.as !== 'font';
      });

      const cssFiles = links.map((link) => link.attributes.href);

      cssFiles.forEach((src) => {
        // Linked to the expected static location
        expect(src).toMatch(/^\/one\/two\/_expo\/static\/css\/.*\.css$/);
      });

      const fontLinks = indexHtml.querySelectorAll('html > head > link[as="font"]');

      const fontFiles = fontLinks.map((link) => link.attributes.href);

      fontFiles.forEach((src) => {
        // Linked to the expected static location
        expect(src).toMatch(/^\/one\/two\/assets\/.*\.ttf/);
      });

      for (const file of [...cssFiles, ...jsFiles]) {
        expect(
          fs.existsSync(
            path.join(
              outputDir,
              // If we strip the asset prefix, the file should exist.
              file.replace(/^\/one\/two/, '')
            )
          )
        ).toBe(true);
      }
    },
    5 * 1000
  );

  it(
    'supports usePathname in +html files',
    async () => {
      const page = await fs.readFile(path.join(outputDir, 'index.html'), 'utf8');

      expect(page).toContain('<meta name="custom-value" content="value"/>');

      // Root element
      expect(page).toContain('<div id="root">');

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
    },
    5 * 1000
  );

  it(
    'supports baseUrl in Links',
    async () => {
      expect(
        (await getPageHtml(outputDir, 'links.html')).querySelector(
          'body > #root a[data-testid="links-one"]'
        )?.attributes.href
      ).toBe('/one/two/about');
    },
    5 * 1000
  );
});
