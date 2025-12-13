/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getPageHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static-rendering with asset prefix for CDN', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering-asset-prefix';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    const assetPrefix = 'https://cdn.example.com';
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_E2E_ASSET_PREFIX: assetPrefix,
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'static-rendering',
        E2E_ROUTER_ASYNC: 'development',
      },
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);

    expect(files.find((file) => file?.match(/_expo\/static\/js\/web\/entry-.*\.js/))).toBeDefined();

    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    expect(files).toContain('about.html');
    expect(files).toContain('index.html');
    expect(files).toContain('styled.html');
    expect(files).toContain('links.html');
  });

  it('writes JS assets with CDN prefix', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const jsFiles = indexHtml
      .querySelectorAll('script')
      .filter((script) => !!script.attributes.src)
      .map((script) => script.attributes.src);

    expect(jsFiles).toEqual([
      expect.stringMatching(/^https:\/\/cdn\.example\.com\/_expo\/static\/js\/web\/entry-.*\.js$/),
    ]);
  });

  it('writes CSS assets with CDN prefix', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
      return link.attributes.as !== 'font';
    });

    const cssFiles = links.map((link) => link.attributes.href);

    cssFiles.forEach((src) => {
      expect(src).toMatch(/^https:\/\/cdn\.example\.com\/_expo\/static\/css\/.*\.css$/);
    });
  });

  it('asset files exist locally (without CDN prefix)', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const jsFiles = indexHtml
      .querySelectorAll('script')
      .filter((script) => !!script.attributes.src)
      .map((script) => script.attributes.src);

    const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
      return link.attributes.as !== 'font';
    });

    const cssFiles = links.map((link) => link.attributes.href);

    for (const file of [...cssFiles, ...jsFiles]) {
      expect(
        fs.existsSync(
          path.join(
            outputDir,
            file.replace(/^https:\/\/cdn\.example\.com/, '')
          )
        )
      ).toBe(true);
    }
  });
});

describe('static-rendering with asset prefix and base path', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering-asset-prefix-base-path';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    const baseUrl = '/my-app';
    const assetPrefix = 'https://cdn.example.com/assets';
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_E2E_BASE_PATH: baseUrl,
        EXPO_E2E_ASSET_PREFIX: assetPrefix,
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'static-rendering',
        E2E_ROUTER_ASYNC: 'development',
      },
    });
  });

  it('writes JS assets with CDN prefix (not base path)', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const jsFiles = indexHtml
      .querySelectorAll('script')
      .filter((script) => !!script.attributes.src)
      .map((script) => script.attributes.src);

    expect(jsFiles).toEqual([
      expect.stringMatching(/^https:\/\/cdn\.example\.com\/assets\/_expo\/static\/js\/web\/entry-.*\.js$/),
    ]);

    jsFiles.forEach((src) => {
      expect(src).not.toMatch(/\/my-app\//);
    });
  });

  it('writes CSS assets with CDN prefix (not base path)', async () => {
    const indexHtml = await getPageHtml(outputDir, 'index.html');

    const links = indexHtml.querySelectorAll('html > head > link').filter((link) => {
      return link.attributes.as !== 'font';
    });

    const cssFiles = links.map((link) => link.attributes.href);

    cssFiles.forEach((src) => {
      expect(src).toMatch(/^https:\/\/cdn\.example\.com\/assets\/_expo\/static\/css\/.*\.css$/);
      expect(src).not.toMatch(/\/my-app\//);
    });
  });

  it('links still use base path', async () => {
    expect(
      (await getPageHtml(outputDir, 'links.html')).querySelector(
        'body > #root a[data-testid="links-one"]'
      )?.attributes.href
    ).toBe('/my-app/about');
  });
});
