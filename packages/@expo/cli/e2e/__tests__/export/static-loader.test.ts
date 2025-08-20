/* eslint-env jest */

import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static loader', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-loader';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'server-loader',
        E2E_ROUTER_SERVER_LOADERS: 'true',
      },
    });
  });

  describe('requests', () => {
    const server = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    beforeAll(async () => {
      await server.startAsync([outputName]);
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    it(`loads and renders a route without a loader`, async () => {
      const path = '/';
      const response = await server.fetchAsync(path);
      expect(response.status).toBe(200);

      const html = getHtml(await response.text());

      // Ensure the loader script is injected and escaped correctly
      const loaderScript = html.querySelector('[data-testid=loader-script]');
      expect(loaderScript).not.toBeNull();
      expect(loaderScript!.textContent).toEqual(
        'window.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse("{\\"/\\":{}}");'
      );
    });

    it(`loads and renders the data correctly for a static route`, async () => {
      const path = '/second';
      const response = await server.fetchAsync(path);
      expect(response.status).toBe(200);

      const html = getHtml(await response.text());

      // Ensure the loader script is injected and escaped correctly
      const loaderScript = html.querySelector('[data-testid=loader-script]');
      expect(loaderScript).not.toBeNull();
      expect(loaderScript!.textContent).toEqual(
        'window.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse("{\\"/second\\":{\\"params\\":{}}}");'
      );

      // Ensure the loader data is rendered in the HTML
      const loaderData = html.querySelector('[data-testid=loader-result]')!;
      expect(loaderData.textContent).toEqual('{"params":{}}');
    });

    it(`loads and renders the data correctly for a dynamic route using generateStaticParams()`, async () => {
      const urlPath = '/posts/static-post-1';
      const response = await server.fetchAsync(urlPath);
      expect(response.status).toBe(200);

      const html = getHtml(await response.text());

      // Ensure the loader script is injected and escaped correctly
      const loaderScript = html.querySelector('[data-testid=loader-script]')!;
      expect(loaderScript).not.toBeNull();
      expect(loaderScript.textContent).toEqual(
        'window.__EXPO_ROUTER_LOADER_DATA__ = JSON.parse("{\\"/posts/static-post-1\\":{\\"params\\":{\\"postId\\":\\"static-post-1\\"}}}");'
      );

      // Ensure the loader data is rendered in the HTML
      const loaderData = html.querySelector('[data-testid=loader-result]')!;
      expect(loaderData.textContent).toEqual('{"params":{"postId":"static-post-1"}}');
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(path.join(projectRoot, outputName));

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // Normal routes
    expect(files).toContain('index.html');

    // Dynamic routes generated via generateStaticParams
    expect(files).toContain('posts/static-post-1.html');
    expect(files).toContain('posts/static-post-2.html');
    // Original dynamic route template should also be exported
    expect(files).toContain('posts/[postId].html');
  });

  it('generates loader data modules during static export', async () => {
    const files = findProjectFiles(path.join(projectRoot, outputName));

    expect(files).toContain('_expo/loaders/second.js');
    expect(files).toContain('_expo/loaders/posts/static-post-1.js');
    expect(files).toContain('_expo/loaders/posts/static-post-2.js');
    // Should also generate loader module for dynamic route template
    expect(files).toContain('_expo/loaders/posts/[postId].js');
  });

  it('loader modules contain only JSON data without server code', async () => {
    const fs = require('fs');
    const loaderModulePath = path.join(projectRoot, outputName, '_expo/loaders/second.js');
    const moduleContent = fs.readFileSync(loaderModulePath, 'utf-8');

    expect(moduleContent).toMatch(/^export default /);
    expect(moduleContent).toContain('"params":{}');

    expect(moduleContent).not.toContain('function');
    expect(moduleContent).not.toContain('async');
    expect(moduleContent).not.toContain('await');
    expect(moduleContent).not.toContain('require');
    expect(moduleContent).not.toContain('process.env');
  });

  it('generates fallback loader module for dynamic route template', async () => {
    const fs = require('fs');
    const dynamicLoaderPath = path.join(projectRoot, outputName, '_expo/loaders/posts/[postId].js');
    const moduleContent = fs.readFileSync(dynamicLoaderPath, 'utf-8');

    expect(moduleContent).toMatch(/^export default /);
    // Should contain bracket notation in the params
    expect(moduleContent).toContain('"postId":"[postId]"');

    // Should not contain server code
    expect(moduleContent).not.toContain('function');
    expect(moduleContent).not.toContain('async');
    expect(moduleContent).not.toContain('await');
  });
});
