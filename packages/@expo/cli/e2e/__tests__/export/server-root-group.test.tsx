import execa from 'execa';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import {
  bin,
  ensurePortFreeAsync,
  findProjectFiles,
  getRouterE2ERoot,
  killChildProcess,
} from '../utils';

runExportSideEffects();

// Repro of https://github.com/expo/expo/issues/29883

describe('server-root-group', () => {
  const projectRoot = getRouterE2ERoot();
  const outputDir = path.join(projectRoot, 'dist-server-root-group');
  const PORT = 3002;
  beforeAll(async () => {
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
  });

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
    });
    const nodeScript = path.join(projectRoot, '__e2e__/server-root-group/express.js');
    let server: execa.ExecaChildProcess<string> | undefined;

    afterAll(async () => {
      if (server) await killChildProcess(server);
    });

    it(`can serve up group routes`, async () => {
      const res = await fetch(`http://localhost:${PORT}`);
      //   const res = await fetch(`http://localhost:${PORT}/(root)`);
      expect(res.status).toEqual(200);

      // Can access the same route from different paths
      expect(await fetch(`http://localhost:${PORT}/`).then((res) => res.text())).toMatch(
        /<div data-testid="index-text">/
      );
      expect(await fetch(`http://localhost:${PORT}`).then((res) => res.text())).toMatch(
        /<div data-testid="index-text">/
      );
      expect(await fetch(`http://localhost:${PORT}/(root)`).then((res) => res.text())).toMatch(
        /<div data-testid="index-text">/
      );
    });
  });

  it('has expected files', async () => {
    // Request HTML

    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
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
