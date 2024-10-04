import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'path';

import { bin, ensurePortFreeAsync, getRouterE2ERoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('server-output', () => {
  const projectRoot = getRouterE2ERoot();
  const outputDir = path.join(projectRoot, 'dist-server');

  beforeAll(
    async () => {
      await execa('node', [bin, 'export', '-p', 'web', '--output-dir', 'dist-server'], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
        },
      });
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  describe('requests', () => {
    beforeAll(async () => {
      await ensurePortFreeAsync(3000);
      // Start a server instance that we can test against then kill it.
      server = execa('node', [nodeScript], {
        cwd: projectRoot,

        stderr: 'inherit',

        env: {
          NODE_ENV: 'production',
          TEST_SECRET_KEY: 'test-secret-key',
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
    const nodeScript = path.join(projectRoot, '__e2e__/server/express.js');
    let server: execa.ExecaChildProcess<string> | undefined;

    afterAll(async () => {
      server?.kill();
    });

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to ${method} routes`, async () => {
        // Request missing route
        expect(
          await fetch('http://localhost:3000/methods', {
            method: method,
          }).then((res) => res.json())
        ).toEqual({
          method: method.toLowerCase(),
        });
      });
    });

    it(`can serve up custom not-found`, async () => {
      const res = await fetch('http://localhost:3000/missing');
      expect(res.status).toEqual(404);
      expect(await res.text()).toMatch(/<div data-testid="custom-404">/);
    });
    it(`can serve HTML and a function from the same route`, async () => {
      expect(
        await fetch('http://localhost:3000/matching-route/alpha').then((res) => res.text())
      ).toMatch(/<div data-testid="alpha-text">/);
      expect(
        await fetch('http://localhost:3000/matching-route/alpha', {
          method: 'POST',
        }).then((res) => res.json())
      ).toEqual({ foo: 'bar' });
    });
    it(`can serve up index html`, async () => {
      expect(await fetch('http://localhost:3000').then((res) => res.text())).toMatch(
        /<div id="root">/
      );
    });

    it(`can serve up group routes`, async () => {
      // Can access the same route from different paths
      expect(await fetch('http://localhost:3000/beta').then((res) => res.text())).toMatch(
        /<div data-testid="alpha-beta-text">/
      );
      expect(await fetch('http://localhost:3000/(alpha)/beta').then((res) => res.text())).toMatch(
        /<div data-testid="alpha-beta-text">/
      );
    });
    it(`can serve up dynamic html routes`, async () => {
      expect(await fetch('http://localhost:3000/blog/123').then((res) => res.text())).toMatch(
        /\[post\]/
      );
    });
    it(`can hit the 404 route`, async () => {
      expect(
        await fetch('http://localhost:3000/clearly-missing').then((res) => res.text())
      ).toMatch(/<div id="root">/);
    });

    it(
      'can use environment variables',
      async () => {
        expect(await fetch('http://localhost:3000/api/env-vars').then((res) => res.json())).toEqual(
          {
            // This is defined when we start the production server in `beforeAll`.
            var: 'test-secret-key',
          }
        );
      },
      5 * 1000
    );
    it(
      'serves the empty route as 405',
      async () => {
        await expect(fetch('http://localhost:3000/api/empty').then((r) => r.status)).resolves.toBe(
          405
        );
      },
      5 * 1000
    );
    it(
      'serves not-found routes as 404',
      async () => {
        await expect(fetch('http://localhost:3000/missing').then((r) => r.status)).resolves.toBe(
          404
        );
      },
      5 * 1000
    );
    it(
      'automatically handles JS errors thrown inside of route handlers as 500',
      async () => {
        const res = await fetch('http://localhost:3000/api/problematic');
        expect(res.status).toBe(500);
        expect(res.statusText).toBe('Internal Server Error');
      },
      5 * 1000
    );
    it(
      'can POST json to a route',
      async () => {
        const res = await fetch('http://localhost:3000/api/json', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ hello: 'world' }),
        }).then((r) => r.json());
        expect(res).toEqual({ hello: 'world' });
      },
      5 * 1000
    );
    it(
      'handles pinging routes with unsupported methods with 405 "Method Not Allowed"',
      async () => {
        const res = await fetch('http://localhost:3000/api/env-vars', { method: 'POST' });
        expect(res.status).toBe(405);
        expect(res.statusText).toBe('Method Not Allowed');
      },
      5 * 1000
    );
    it(
      'supports accessing dynamic parameters using same convention as client-side Expo Router',
      async () => {
        await expect(fetch('http://localhost:3000/api/abc').then((r) => r.json())).resolves.toEqual(
          {
            hello: 'abc',
          }
        );
      },
      5 * 1000
    );
    it(
      'supports accessing deep dynamic parameters using different convention to client-side Expo Router',
      async () => {
        await expect(
          fetch('http://localhost:3000/api/a/1/2/3').then((r) => r.json())
        ).resolves.toEqual({
          results: '1/2/3',
        });
      },
      5 * 1000
    );
    it(
      'supports using Node.js externals to read local files',
      async () => {
        await expect(
          fetch('http://localhost:3000/api/externals').then((r) => r.text())
        ).resolves.toEqual('a/b/c');
      },
      5 * 1000
    );
  });

  it(
    'has expected files',
    async () => {
      // Request HTML

      // List output files with sizes for snapshotting.
      // This is to make sure that any changes to the output are intentional.
      // Posix path formatting is used to make paths the same across OSes.
      const files = klawSync(outputDir)
        .map((entry) => {
          if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
            return null;
          }
          return path.posix.relative(outputDir, entry.path);
        })
        .filter(Boolean);

      // The wrapper should not be included as a route.
      expect(files).not.toContain('+html.html');
      expect(files).not.toContain('_layout.html');

      // Has routes.json
      expect(files).toContain('_expo/routes.json');

      // Has functions
      expect(files).toContain('_expo/functions/methods+api.js');
      expect(files).toContain('_expo/functions/api/[dynamic]+api.js');
      expect(files).toContain('_expo/functions/api/externals+api.js');

      // TODO: We shouldn't export this
      expect(files).toContain('_expo/functions/api/empty+api.js');

      // Has single variation of group file
      expect(files).toContain('(alpha)/beta.html');
      expect(files).not.toContain('beta.html');

      // Injected by framework
      expect(files).toContain('_sitemap.html');
      expect(files).toContain('+not-found.html');

      // Normal routes
      expect(files).toContain('index.html');
      expect(files).toContain('blog/[post].html');
    },
    5 * 1000
  );
});
