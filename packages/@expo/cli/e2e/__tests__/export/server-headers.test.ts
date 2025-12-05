/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import {
  prepareServers,
  setupServer,
  RUNTIME_EXPO_SERVE,
  RUNTIME_WORKERD,
} from '../../utils/runtime';

runExportSideEffects();

describe('export server with custom headers', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_WORKERD], {
      fixtureName: 'server-headers',
      export: {
        env: {
          E2E_ROUTER_HEADERS: JSON.stringify({
            'X-Powered-By': 'expo-server',
            'Set-Cookie': ['hello=world', 'foo=bar'],
            'Content-Type': 'application/pdf',
          }),
          E2E_ROUTER_REWRITES: JSON.stringify([
            { source: '/rewrite/api', destination: '/api' },
          ]),
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it('includes headers in routes.json manifest', () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.resolve(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      );
      expect(routesJson.headers).toEqual({
        'X-Powered-By': 'expo-server',
        'Set-Cookie': ['hello=world', 'foo=bar'],
        'Content-Type': 'application/pdf',
      });
    });

    it.each([
      {
        path: '/',
        status: 200,
        contentType: 'text/html',
      },
      {
        path: '/api',
        status: 200,
        contentType: 'application/json',
      },
      {
        path: '/rewrite/api',
        status: 200,
        contentType: 'application/json',
      },
      {
        path: '/not-a-route',
        status: 404,
        contentType: 'text/html',
      },
    ])('applies custom headers to $path', async ({ path, status, contentType }) => {
      const response = await server.fetchAsync(path);

      expect(response.status).toBe(status);

      // Check that existing Content-Type header is not overridden
      expect(response.headers.get('Content-Type')).toBe(contentType);

      // Check single-value custom header
      expect(response.headers.get('X-Powered-By')).toBe('expo-server');

      // Check array-value custom headers
      expect(response.headers.get('Set-Cookie')).toBe('hello=world, foo=bar');
    });
  });
});
