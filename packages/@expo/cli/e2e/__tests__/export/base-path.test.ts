import fs from 'fs';
import path from 'path';

import { executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getPageHtml, getServerTesterRoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('static-rendering with a custom base path', () => {
  const projectRoot = getServerTesterRoot();
  const outputName = 'dist-static-rendering-base-path';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    const baseUrl = '/one/two';
    process.env.EXPO_E2E_BASE_PATH = baseUrl;
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_E2E_BASE_PATH: baseUrl,
        E2E_ROUTER_WEB_OUTPUT: 'static',
        E2E_ROUTER_ASYNC: 'development',
      },
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);

    expect(files.find((file) => file?.match(/_expo\/static\/js\/web\/entry-.*\.js/))).toBeDefined();

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // Normal routes
    expect(files).toContain('rendering/about.html');
    expect(files).toContain('index.html');
    expect(files).toContain('rendering/styled.html');
    expect(files).toContain('rendering/links.html');

    // generateStaticParams values
    expect(files).toContain('rendering/[post].html');
    expect(files).toContain('rendering/welcome-to-the-universe.html');
    expect(files).toContain('rendering/other.html');
  });

  it('writes assets with prefix', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const jsFiles = indexHtml
      .querySelectorAll('script')
      .map((script) => script.attributes.src)
      .filter((src): src is string => !!src);
    expect(jsFiles).toEqual([
      expect.stringMatching(/\/one\/two\/_expo\/static\/js\/web\/entry-.*\.js/),
    ]);

    const links = indexHtml.querySelectorAll('head link[rel="stylesheet"], head link[as="style"]');

    const cssFiles = links
      .map((link) => link.attributes.href)
      .filter((link): link is string => !!link);

    cssFiles.forEach((src) => {
      // Linked to the expected static location
      expect(src).toMatch(/^\/one\/two\/_expo\/static\/css\/.*\.css$/);
    });

    const fontsHtml = await getPageHtml(outputDir, 'rendering/fonts.html');
    const fontLinks = fontsHtml.querySelectorAll('html > head > link[as="font"]');

    const fontFiles = fontLinks.map((link) => link.attributes.href);
    expect(fontFiles.length).toBeGreaterThan(0);

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
  });

  it('supports the pathname and params props in +html files', async () => {
    const page = await fs.promises.readFile(path.join(outputDir, 'index.html'), 'utf8');

    expect(page).toContain('<meta name="custom-value" content="value"/>');

    // Root element
    expect(page).toContain('<div id="root">');

    expect(
      (await getPageHtml(outputDir, 'rendering/about.html')).querySelector(
        'html > head > meta[name="expo-e2e-pathname"]'
      )?.attributes.content
    ).toBe('/rendering/about');

    expect(
      (await getPageHtml(outputDir, 'index.html')).querySelector(
        'html > head > meta[name="expo-e2e-pathname"]'
      )?.attributes.content
    ).toBe('/');

    expect(
      (await getPageHtml(outputDir, 'rendering/welcome-to-the-universe.html')).querySelector(
        'html > head > meta[name="expo-e2e-pathname"]'
      )?.attributes.content
    ).toBe('/rendering/welcome-to-the-universe');

    expect(
      (await getPageHtml(outputDir, 'rendering/welcome-to-the-universe.html')).querySelector(
        'html > head > meta[name="expo-e2e-params"]'
      )?.attributes.content
    ).toBe('{"post":"welcome-to-the-universe"}');
  });

  it('supports baseUrl in Links', async () => {
    expect(
      (await getPageHtml(outputDir, 'rendering/links.html')).querySelector(
        'body > #root a[data-testid="links-one"]'
      )?.attributes.href
    ).toBe('/one/two/rendering/about');
  });
});
