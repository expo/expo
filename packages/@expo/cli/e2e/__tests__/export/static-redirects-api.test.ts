/* eslint-env jest */
import type { RedirectConfig } from 'expo-router';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { processFindPrefixedValue } from '../../utils/process';
import { createBackgroundServer } from '../../utils/server';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('server api redirects', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-redirects';

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'server',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
          E2E_ROUTER_REDIRECTS: JSON.stringify([
            {
              source: '/redirect-methods+api',
              destination: '/methods+api',
            },
          ] as RedirectConfig[]),
        },
      }
    );
  });

  describe('requests', () => {
    const server = createBackgroundServer({
      command: ['node', path.join(projectRoot, '__e2e__/server/express.js')],
      host: (chunk) =>
        processFindPrefixedValue(chunk, 'Express server listening') && 'http://localhost',
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        TEST_SECRET_KEY: 'test-secret-key',
      },
    });

    beforeAll(async () => {
      await server.startAsync();
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    ['POST', 'GET', 'PUT', 'DELETE'].map(async (method) => {
      it(`can make requests to ${method} routes`, async () => {
        // Request missing route
        // expect(
        //   await server.fetchAsync('/redirect-methods', { method }).then((res) => res.json())
        // ).toEqual({
        //   method: method.toLowerCase(),
        // });
      });
    });
  });
});
