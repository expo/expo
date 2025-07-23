/* eslint-env jest */
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

// Repro of https://github.com/expo/expo/issues/29883

describe('server-root-group', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-server-root-group';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    console.time('export-server-root-group');
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'server-root-group',
      },
    });
    console.timeEnd('export-server-root-group');
  });

  describe('requests', () => {
    const server = createExpoServe({
      cwd: projectRoot,
    });

    beforeAll(async () => {
      await server.startAsync([outputName]);
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    it(`can serve up group routes`, async () => {
      const res = await server.fetchAsync('');
      //   const res = await fetch(`http://localhost:${PORT}/(root)`);
      expect(res.status).toEqual(200);

      // Can access the same route from different paths
      expect(await server.fetchAsync('/').then((res) => res.text())).toMatch(
        /<div data-testid="index-text">/
      );
      expect(await server.fetchAsync('').then((res) => res.text())).toMatch(
        /<div data-testid="index-text">/
      );
      expect(await server.fetchAsync('/(root)').then((res) => res.text())).toMatch(
        /<div data-testid="index-text">/
      );
    });
  });

  it('has expected files', async () => {
    // Request HTML
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('server/+html.html');
    expect(files).not.toContain('server/_layout.html');

    // Has routes.json
    expect(files).toContain('server/_expo/routes.json');

    // HTML
    expect(files).toContain('server/(root)/index.html');
    expect(files).not.toContain('server/index.html');
  });
});
