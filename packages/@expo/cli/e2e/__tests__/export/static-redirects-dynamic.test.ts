/* eslint-env jest */
import type { RedirectConfig } from 'expo-router';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static redirects to dynamic routes', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-redirects-dynamic';

  beforeAll(async () => {
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: 'static-redirects',
          E2E_ROUTER_ASYNC: 'development',
          E2E_ROUTER_REDIRECTS: JSON.stringify([
            // Redirect from a static path to a destination that matches a dynamic route [post]
            // The redirect should go to /blog/expo-apps, NOT /blog/[post]
            { source: '/blog/expo-2024', destination: '/blog/expo-apps' },
            { source: '/blog/old-post', destination: '/blog/new-post', permanent: true },
          ] as RedirectConfig[]),
        },
      }
    );
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

    it('redirects static path to dynamic route with correct destination URL', async () => {
      // When redirecting /blog/expo-2024 to /blog/expo-apps (handled by /blog/[post])
      // The redirect Location header should be /blog/expo-apps, NOT /blog/[post]
      const response = await server.fetchAsync('/blog/expo-2024', {
        redirect: 'manual',
      });

      expect(response.status).toBe(302);
      const location = response.headers.get('location');
      expect(new URL(location!).pathname).toBe('/blog/expo-apps');
      // Ensure it's NOT the route pattern
      expect(location).not.toContain('/blog/[post]');
    });

    it('follows redirect to the correct destination', async () => {
      const response = await server.fetchAsync('/blog/expo-2024');

      expect(response.status).toBe(200);
      expect(response.redirected).toBe(true);
      expect(new URL(response.url).pathname).toBe('/blog/expo-apps');
    });

    it('handles permanent redirects to dynamic routes correctly', async () => {
      const response = await server.fetchAsync('/blog/old-post', {
        redirect: 'manual',
      });

      expect(response.status).toBe(301);
      const location = response.headers.get('location');
      expect(new URL(location!).pathname).toBe('/blog/new-post');
    });
  });
});
