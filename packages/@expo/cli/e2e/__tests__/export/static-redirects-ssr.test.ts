/* eslint-env jest */
import type { RedirectConfig } from 'expo-router';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports server', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-redirects-ssr';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: 'static-redirects',
        E2E_ROUTER_REDIRECTS: JSON.stringify([
          { source: '/external-redirect', destination: 'https://expo.dev' },
        ] as RedirectConfig[]),
      },
    });
  });

  describe('requests', () => {
    const server = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    beforeAll(async () => {
      await server.startAsync([outputName]);
    });
    afterAll(async () => {
      await server.stopAsync();
    });

    it('gets an external URL redirect', async () => {
      const res = await server.fetchAsync('/external-redirect');
      expect(res.status).toBe(200);
      expect(res.url).toBe('https://expo.dev/');
    });
  });
});
