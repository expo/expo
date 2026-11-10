/* eslint-env jest */
import path from 'node:path';

import { executeExpoAsync } from '../../utils/expo';
import {
  prepareServers,
  setupServer,
  RUNTIME_EXPO_SERVE,
  RUNTIME_EXPO_START,
} from '../../utils/runtime';
import { findProjectFiles, getServerTesterRoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('static export with middleware', () => {
  const projectRoot = getServerTesterRoot();
  const outputName = 'dist-static-middleware';
  const outputDir = path.join(projectRoot, outputName);

  describe('static', () => {
    it('skips middleware when exporting a project with web.output === static', async () => {
      const results = await executeExpoAsync(
        projectRoot,
        ['export', '-p', 'web', '--output-dir', outputName],
        {
          env: {
            NODE_ENV: 'production',
            E2E_ROUTER_WEB_OUTPUT: 'static',
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
      app: 'server-tester',
      uniqueOutputKey: `middleware-${output}-${apiRoutes}`,
      export: {
        env: {
          E2E_ROUTER_WEB_OUTPUT: output,
          E2E_ROUTER_API_ROUTES: String(apiRoutes),
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it('runs middleware before pages', async () => {
      const response = await server.fetchAsync('/middleware?e2e=custom-response');
      expect(response.status).toBe(200);
      expect(await response.text()).toContain('Custom response from middleware');
    });

    if (apiRoutes) {
      it('runs middleware before API routes', async () => {
        const response = await server.fetchAsync('/api/methods?e2e=error');
        expect(response.status).toBe(500);
      });
    }
  });
});
