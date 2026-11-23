/* eslint-env jest */
import type { RedirectConfig } from 'expo-router';
import path from 'path';

import { executeExpoAsync } from '../../utils/expo';
import { createStaticServe } from '../../utils/server';
import { findProjectFiles, getServerTesterRoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('exports static', () => {
  const projectRoot = getServerTesterRoot();
  const outputName = 'dist-static-redirects';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          E2E_ROUTER_WEB_OUTPUT: 'static',
          E2E_ROUTER_ASYNC: 'false',
          E2E_ROUTER_REDIRECTS: JSON.stringify([
            { source: '/styled-redirect', destination: '/rendering/styled' },
          ] as RedirectConfig[]),
        },
      }
    );
  });

  describe('server', () => {
    const server = createStaticServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
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

    it(`gets a screen redirect`, async () => {
      expect(await server.fetchAsync('/styled-redirect').then((res) => res.status)).toBe(200);
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
    expect(files).toContain('rendering/about.html');
    expect(files).toContain('index.html');
    expect(files).toContain('rendering/styled.html');

    // Redirect routes
    expect(files).toContain('styled-redirect.html');

    // generateStaticParams values
    expect(files).toContain('rendering/[post].html');
    expect(files).toContain('rendering/welcome-to-the-universe.html');
    expect(files).toContain('rendering/other.html');
  });
});
