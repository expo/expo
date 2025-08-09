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

    it(`loads and renders the data correctly for a static route`, async () => {
      const path = '/';
      const response = await server.fetchAsync(path);
      expect(response.status).toBe(200);

      const html = getHtml(await response.text());

      // Ensure the loader script is injected
      const loaderScript = html.querySelector('[data-testid=loader-script]')!;
      expect(loaderScript.textContent).toEqual(
        'window.__EXPO_ROUTER_LOADER_DATA__ = {"/":{"foo":"bar"}};'
      );

      // Ensure the loader data is rendered in the HTML
      const loaderData = html.querySelector('[data-testid=loader-result]')!;
      expect(loaderData.textContent).toEqual('{"foo":"bar"}');
    });

    it(`loads and renders the data correctly for a dynamic route using generateStaticParams()`, async () => {
      // TODO(@hassankhan): Investigate why we need to use the `.html` suffix
      const urlPath = '/posts/foo.html';
      const response = await server.fetchAsync(urlPath);
      expect(response.status).toBe(200);

      const html = getHtml(await response.text());

      // Ensure the loader script is injected
      const loaderScript = html.querySelector('[data-testid=loader-script]')!;
      expect(loaderScript.textContent).toEqual(
        'window.__EXPO_ROUTER_LOADER_DATA__ = {"/posts/foo":{"params":{"postId":"foo"}}};'
      );

      // Ensure the loader data is rendered in the HTML
      const loaderData = html.querySelector('[data-testid=loader-result]')!;
      expect(loaderData.textContent).toEqual('{"params":{"postId":"foo"}}');
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
    expect(files).toContain('posts/foo.html');
    expect(files).toContain('posts/bar.html');
    // Original dynamic route template should also be exported
    expect(files).toContain('posts/[postId].html');
  });
});
