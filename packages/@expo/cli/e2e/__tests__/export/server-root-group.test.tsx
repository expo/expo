/* eslint-env jest */
import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { processFindPrefixedValue } from '../../utils/process';
import { createBackgroundServer } from '../../utils/server';
import { bin, getRouterE2ERoot } from '../utils';

runExportSideEffects();

// Repro of https://github.com/expo/expo/issues/29883

describe('server-root-group', () => {
  const projectRoot = getRouterE2ERoot();
  const outputDir = path.join(projectRoot, 'dist-server-root-group');

  beforeAll(
    async () => {
      console.time('export-server-root-group');
      await execa('node', [bin, 'export', '-p', 'web', '--output-dir', 'dist-server-root-group'], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server-root-group',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      });
      console.timeEnd('export-server-root-group');
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  function getFiles() {
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    return klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);
  }

  describe('requests', () => {
    const server = createBackgroundServer({
      command: ['node', path.join(projectRoot, '__e2e__/server-root-group/express.js')],
      host: (chunk) => processFindPrefixedValue(chunk, 'Express server ready'),
    });

    beforeAll(async () => {
      await server.startAsync();
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

  it(
    'has expected files',
    async () => {
      // Request HTML

      // List output files with sizes for snapshotting.
      // This is to make sure that any changes to the output are intentional.
      // Posix path formatting is used to make paths the same across OSes.
      const files = getFiles();

      // The wrapper should not be included as a route.
      expect(files).not.toContain('server/+html.html');
      expect(files).not.toContain('server/_layout.html');

      // Has routes.json
      expect(files).toContain('server/_expo/routes.json');

      // HTML
      expect(files).toContain('server/(root)/index.html');
      expect(files).not.toContain('server/index.html');
    },
    5 * 1000
  );
});
