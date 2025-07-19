/* eslint-env jest */
import type { RedirectConfig } from 'expo-router';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { createStaticServe } from '../../utils/server';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports static', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-redirects';
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
          E2E_ROUTER_REDIRECTS: JSON.stringify([
            { source: '/styled-redirect', destination: '/styled' },
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
    expect(files).toContain('about.html');
    expect(files).toContain('index.html');
    expect(files).toContain('styled.html');

    // Redirect routes
    expect(files).toContain('styled-redirect.html');

    // generateStaticParams values
    expect(files).toContain('[post].html');
    expect(files).toContain('welcome-to-the-universe.html');
    expect(files).toContain('other.html');
  });
});
