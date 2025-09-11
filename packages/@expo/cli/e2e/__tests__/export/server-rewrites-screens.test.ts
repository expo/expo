/* eslint-env jest */
import { RewriteConfig } from 'expo-router/build/getRoutesCore';
import * as htmlParser from 'node-html-parser';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getRouterE2ERoot } from '../utils';
import path from 'node:path';

runExportSideEffects();

describe('server rewrites', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-server-rewrites-screens';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'static-rendering',
        E2E_ROUTER_REWRITES: JSON.stringify([
          { source: '/rewrite', destination: '/styled' },
        ] as RewriteConfig[]),
      },
    });
  });

  describe('server', () => {
    const server = createExpoServe({
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

    it(`correctly shows the destination contents after a rewrite`, async () => {
      const getIndexText = (htmlString: string) => {
        return htmlParser.parse(htmlString).querySelector('[data-testid=styled-text]')!.textContent;
      };

      const indexResponse = await server.fetchAsync('/styled');
      expect(indexResponse.status).toBe(200);

      const path = '/rewrite';
      const rewriteResponse = await server.fetchAsync(path);
      expect(rewriteResponse.status).toBe(200);
      expect(new URL(rewriteResponse.url).pathname).toBe(path);

      const actual = getIndexText(await rewriteResponse.text());
      const expected = getIndexText(await indexResponse.text());

      expect(actual).toEqual(expected);
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(path.join(projectRoot, outputName, 'server'));

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

    // Rewrite routes should not be written to disk
    expect(files).not.toContain('rewrite.html');

    // generateStaticParams values
    expect(files).toContain('[post].html');
    expect(files).toContain('welcome-to-the-universe.html');
    expect(files).toContain('other.html');
  });
});
