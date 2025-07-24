/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getPageHtml, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports middleware', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-server-middleware-async';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server-middleware-async',
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
      expect(await server.fetchAsync('/').then((res) => res.text())).toMatch(/<div id="root">/);
    });

    it(`gets a 404`, async () => {
      expect(await server.fetchAsync('/missing-route').then((res) => res.status)).toBe(404);
    });

    it('can use environment variables', async () => {
      const response = await server.fetchAsync('/?e2e=read-env').then((res) => res.json());
      expect(response['TEST_SECRET_KEY']).toEqual('test-secret-key');
    });

    it('can perform dynamic redirects', async () => {
      const regularResponseBody = await server.fetchAsync('/').then((res) => res.text());
      const redirectedResponseBody = await server.fetchAsync('/?e2e=redirect').then((res) => res.text());

      expect(regularResponseBody).not.toEqual(redirectedResponseBody);
    });

    it('can perform dynamic redirects with a status code', async () => {
      const response = await server.fetchAsync('/?e2e=redirect-301', {
        redirect: 'manual',
      });
      expect(response.status).toBe(301);

      const url = new URL(response.headers.get('location')!)
      expect(url.pathname).toEqual('/second');
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // In server mode, HTML files are in the server directory
    expect(files).toContain('server/_sitemap.html');

    expect(files).toContain('server/+not-found.html');
    expect(files).toContain('server/index.html');

    // Middleware should be bundled and referenced in routes.json
    expect(files).toContain('server/_expo/functions/+middleware.js');
    const routesJson = JSON.parse(
      fs.readFileSync(path.join(outputDir, 'server/_expo/routes.json'), 'utf8')
    );
    expect(routesJson.middleware).toBeDefined();
    expect(routesJson.middleware.file).toBe('_expo/functions/+middleware.js');
  });

  it('has source maps', async () => {
    const files = findProjectFiles(outputDir);

    const middlewareMapFile = 'server/_expo/functions/+middleware.js.map';
    expect(files).toContain(middlewareMapFile);

    // Load the sourcemap and check that the paths are relative
    const sourceMap = JSON.parse(
      fs.readFileSync(path.join(outputDir, middlewareMapFile), 'utf8')
    );
    expect(sourceMap.sources).toContain('__e2e__/server-middleware-async/app/+middleware.ts');
  });
});
