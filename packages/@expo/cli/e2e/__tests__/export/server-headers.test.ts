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

const GLOBAL_HEADERS = {
  'X-Powered-By': 'expo-server',
  'X-Global': 'global',
  'Set-Cookie': ['session=1', 'session=2'],
  'Content-Type': 'application/pdf',
};

const PAGE_HEADERS = [
  { source: '/', headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' } },
  { source: '/api', headers: { 'Set-Cookie': ['page=1'] } },
];

const EXPECTED_PAGE_HEADERS = [
  {
    namedRegex: '^/(?:/)?$',
    routeKeys: {},
    headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' },
  },
  {
    namedRegex: '^/api(?:/)?$',
    routeKeys: {},
    headers: { 'Set-Cookie': ['page=1'] },
  },
];

describe('export server with headers', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE, RUNTIME_WORKERD], {
      fixtureName: 'server-headers',
      export: {
        env: {
          E2E_ROUTER_HEADERS: JSON.stringify(GLOBAL_HEADERS),
          E2E_ROUTER_REWRITES: JSON.stringify([{ source: '/rewrite/api', destination: '/api' }]),
          E2E_ROUTER_PAGE_HEADERS: JSON.stringify(PAGE_HEADERS),
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it('includes `headers` and `pageHeaders` in the export manifest', () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.resolve(server.outputDir, 'server/_expo/routes.json'), 'utf8')
      );
      expect(routesJson.headers).toEqual(GLOBAL_HEADERS);
      expect(routesJson.pageHeaders).toEqual(EXPECTED_PAGE_HEADERS);
    });

    it.each([
      {
        path: '/',
        status: 200,
        contentType: 'text/html',
        poweredBy: 'page-override',
        pageRule: 'index',
        setCookie: 'session=1, session=2',
      },
      {
        path: '/api',
        status: 200,
        contentType: 'application/json',
        poweredBy: 'expo-server',
        pageRule: null,
        setCookie: 'session=1, session=2, page=1',
      },
      {
        path: '/rewrite/api',
        status: 200,
        contentType: 'application/json',
        poweredBy: 'expo-server',
        pageRule: null,
        setCookie: 'session=1, session=2',
      },
      {
        path: '/not-a-route',
        status: 404,
        contentType: 'text/html',
        poweredBy: 'expo-server',
        pageRule: null,
        setCookie: 'session=1, session=2',
      },
    ])(
      'applies `headers` and matching `pageHeaders` to $path',
      async ({ path, status, contentType, poweredBy, pageRule, setCookie }) => {
        const response = await server.fetchAsync(path);

        expect(response.status).toBe(status);
        // A global scalar never overrides a header the route already set (e.g. Content-Type)
        expect(response.headers.get('Content-Type')).toBe(contentType);
        // Global headers are always applied
        expect(response.headers.get('X-Global')).toBe('global');
        // Per-path scalar headers override globals
        expect(response.headers.get('X-Powered-By')).toBe(poweredBy);
        // Per-path headers are scoped to the requested path
        expect(response.headers.get('X-Page-Rule')).toBe(pageRule);
        // Array headers accumulate
        expect(response.headers.get('Set-Cookie')).toBe(setCookie);
      }
    );
  });
});
