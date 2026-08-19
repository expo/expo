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
  { source: '/api', headers: { 'Set-Cookie': ['page=1'], 'Content-Type': 'text/should-not-apply' } },
  { source: '/blog', headers: { 'X-Page-Rule': 'blog' } },
];

const EXPECTED_PAGE_HEADERS = [
  {
    namedRegex: '^/(?:/)?$',
    headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' },
  },
  {
    namedRegex: '^/api(?:/)?$',
    headers: { 'Set-Cookie': ['page=1'], 'Content-Type': 'text/should-not-apply' },
  },
  {
    namedRegex: '^/blog(?:/)?$',
    headers: { 'X-Page-Rule': 'blog' },
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
          E2E_ROUTER_SERVER_LOADERS: 'true',
          E2E_ROUTER_SERVER_RENDERING: 'true',
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
        // API routes only apply global headers
        path: '/api',
        status: 200,
        contentType: 'application/json',
        poweredBy: 'expo-server',
        pageRule: null,
        setCookie: 'session=1, session=2',
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
        path: '/blog',
        status: 200,
        contentType: 'text/html',
        poweredBy: 'expo-server',
        pageRule: 'blog',
        setCookie: 'session=1, session=2',
      },
      {
        // Loader routes only apply global headers
        path: '/_expo/loaders/blog',
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
        expect(response.headers.get('Content-Type')).toBe(contentType);
        expect(response.headers.get('X-Global')).toBe('global');
        expect(response.headers.get('X-Powered-By')).toBe(poweredBy);
        expect(response.headers.get('X-Page-Rule')).toBe(pageRule);
        expect(response.headers.get('Set-Cookie')).toBe(setCookie);
      }
    );
  });
});
