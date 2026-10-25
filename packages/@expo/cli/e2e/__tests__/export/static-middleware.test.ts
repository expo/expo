/* eslint-env jest */
import path from 'node:path';

import { executeExpoAsync } from '../../utils/expo';
import {
  prepareServers,
  setupServer,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
} from '../../utils/runtime';
import { findProjectFiles, getRouterE2ERoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('static export with middleware', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-middleware-async';
  const outputDir = path.join(projectRoot, outputName);

  describe('static', () => {
    it('skips middleware when exporting a project with web.output === static', async () => {
      const results = await executeExpoAsync(
        projectRoot,
        ['export', '-p', 'web', '--output-dir', outputName],
        {
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_ROUTER_SRC: 'server-middleware-async',
          },
        }
      );

      expect(results.stderr).toContain(
        'Skipping export for middleware because `web.output` is not "server"'
      );

      const files = findProjectFiles(outputDir);
      expect(files).not.toContain('server/_expo/functions/+middleware.js');
    });
  });
});

describe.each([
  { output: 'static', apiRoutes: true },
  { output: 'server', apiRoutes: false },
])('middleware with $output output and apiRoutes: $apiRoutes', ({ output, apiRoutes }) => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_EXPO_START], {
      fixtureName: 'server-middleware-async',
      uniqueOutputKey: `middleware-${output}-${apiRoutes}`,
      export: {
        env: {
          EXPO_USE_STATIC: output,
          E2E_ROUTER_API_ROUTES: String(apiRoutes),
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it('runs middleware before pages', async () => {
      const response = await server.fetchAsync('/?e2e=custom-response');
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('Custom response from middleware');
    });

    if (apiRoutes) {
      it('runs middleware before API routes', async () => {
        const response = await server.fetchAsync('/api?e2e=error');
        expect(response.status).toBe(500);
      });
    }
  });
});
