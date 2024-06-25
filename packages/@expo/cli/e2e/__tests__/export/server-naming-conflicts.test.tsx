import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { bin, ensurePortFreeAsync, getRouterE2ERoot } from '../utils';

runExportSideEffects();

// Test fixtures for https://github.com/expo/expo/pull/29689
// Given route files that have names that after sanitization are identical,
// we test whether the output bundles conflict with one another.

// NOTE(@kitten): This test is based on `./server-root-group.test.tsx`
describe('server-naming-conflicts', () => {
  const projectRoot = getRouterE2ERoot();
  const outputDir = path.join(projectRoot, 'dist-server-naming-conflicts');
  const PORT = 3003;
  beforeAll(
    async () => {
      console.time('export-server-naming-conflicts');
      await execa(
        'node',
        [bin, 'export', '-p', 'web', '--output-dir', 'dist-server-naming-conflicts'],
        {
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'server',
            E2E_ROUTER_SRC: 'server-naming-conflicts',
            E2E_ROUTER_ASYNC: 'production',
            EXPO_USE_FAST_RESOLVER: 'true',
          },
        }
      );
      console.timeEnd('export-server-naming-conflicts');
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
    beforeAll(async () => {
      await ensurePortFreeAsync(PORT);
      // Start a server instance that we can test against then kill it.
      server = execa('node', [nodeScript], {
        cwd: projectRoot,

        stderr: 'inherit',

        env: {
          PORT: String(PORT),
          NODE_ENV: 'production',
        },
      });
      // Wait for the server to start
      await new Promise((resolve) => {
        const listener = server!.stdout?.on('data', (data) => {
          if (data.toString().includes('server listening')) {
            console.log('Express server ready');
            resolve(null);
            listener?.removeAllListeners();
          }
        });
      });
    }, 120 * 1000);
    const nodeScript = path.join(projectRoot, '__e2e__/server-naming-conflicts/express.js');
    let server: execa.ExecaChildProcess<string> | undefined;

    afterAll(async () => {
      server?.kill();
    });

    it(`can serve up routes with conflicting output names`, async () => {
      // can access '/[root]'
      expect(await fetch(`http://localhost:${PORT}/root`).then((res) => res.text())).toMatch(
        /<div data-testid="root-dynamic">/
      );

      // can access '/_root_'
      expect(await fetch(`http://localhost:${PORT}/_root_`).then((res) => res.text())).toMatch(
        /<div data-testid="root-static">/
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
      expect(files).toContain('server/[root].html');
      expect(files).toContain('server/_root_.html');

      // JS
      const jsFiles = files.filter((file) => file && file.endsWith('.js')).sort();
      expect(jsFiles).toEqual(
        ['_root_', '_root_', 'index'].map((file) =>
          expect.stringMatching(new RegExp(`client\\/_expo\\/static\\/js\\/web\\/${file}-.*\\.js`))
        )
      );
    },
    5 * 1000
  );
});
