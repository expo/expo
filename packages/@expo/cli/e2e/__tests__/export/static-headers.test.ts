/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { prepareServers, RUNTIME_EXPO_SERVE, setupServer } from '../../utils/runtime';
import { findProjectFiles } from '../utils';

runExportSideEffects();

const GLOBAL_HEADERS = {
  'X-Powered-By': 'expo-server',
  'X-Global': 'global',
  'Set-Cookie': ['session=1', 'session=2'],
  'Content-Type': 'application/pdf',
};

const PAGE_HEADERS = [
  { source: '/', headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' } },
  { source: '/blog', headers: { 'X-Page-Rule': 'blog', 'Cache-Control': 'public, max-age=3600' } },
  { source: '/_expo/loaders/blog', headers: { 'Cache-Control': 'public, max-age=604800' } },
];

const EXPECTED_PAGE_HEADERS = [
  {
    namedRegex: '^/(?:/)?$',
    headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' },
  },
  {
    namedRegex: '^/blog(?:/)?$',
    headers: { 'X-Page-Rule': 'blog', 'Cache-Control': 'public, max-age=3600' },
  },
  {
    namedRegex: '^/_expo/loaders/blog(?:/)?$',
    headers: { 'Cache-Control': 'public, max-age=604800' },
  },
  // Added from `/blog`'s loader `Response` at export time and appended after
  // the config option rules.
  {
    namedRegex: '^/blog(?:/)?$',
    headers: { 'Cache-Control': 'public, max-age=86400' },
  },
  {
    namedRegex: '^/_expo/loaders/blog(?:/)?$',
    headers: { 'Cache-Control': 'public, max-age=86400' },
  },
];

describe('export static with headers', () => {
  describe.each(
    prepareServers([RUNTIME_EXPO_SERVE], {
      fixtureName: 'server-headers',
      uniqueOutputKey: 'static',
      export: {
        env: {
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SERVER_LOADERS: 'true',
          E2E_ROUTER_HEADERS: JSON.stringify(GLOBAL_HEADERS),
          E2E_ROUTER_PAGE_HEADERS: JSON.stringify(PAGE_HEADERS),
        },
      },
    })
  )('$name requests', (config) => {
    const server = setupServer(config);

    it('includes `headers` and `pageHeaders` in the export manifest', () => {
      const routesJson = JSON.parse(
        fs.readFileSync(path.resolve(server.outputDir, '_expo/.routes.json'), 'utf8')
      );
      expect(routesJson.headers).toEqual(GLOBAL_HEADERS);
      expect(routesJson.pageHeaders).toEqual(EXPECTED_PAGE_HEADERS);
    });

    it.each([
      {
        path: '/',
        status: 200,
        contentType: 'text/html; charset=UTF-8',
        poweredBy: 'page-override',
        pageRule: 'index',
        setCookie: 'session=1, session=2',
        cacheControl: 'public, max-age=0',
      },
      {
        // The loader-declared `Cache-Control` wins over the config option's
        // `/blog` rule
        path: '/blog',
        status: 200,
        contentType: 'text/html; charset=UTF-8',
        poweredBy: 'expo-server',
        pageRule: 'blog',
        setCookie: 'session=1, session=2',
        cacheControl: 'public, max-age=86400',
      },
      {
        // Loader data files apply global headers and matching rules, with the
        // loader-declared `Cache-Control` winning over the config option's rule
        path: '/_expo/loaders/blog',
        status: 200,
        contentType: 'application/octet-stream',
        poweredBy: 'expo-server',
        pageRule: null,
        setCookie: 'session=1, session=2',
        cacheControl: 'public, max-age=86400',
      },
      {
        // NOTE(@hassankhan): This currently diverges from SSR/EAS.
        // The static file server serves 404s without header application
        path: '/not-a-route',
        status: 404,
        contentType: null,
        poweredBy: null,
        pageRule: null,
        setCookie: null,
        cacheControl: null,
      },
    ])(
      'applies `headers` and matching `pageHeaders` to $path',
      async ({ path, status, contentType, poweredBy, pageRule, setCookie, cacheControl }) => {
        const response = await server.fetchAsync(path);

        expect(response.status).toBe(status);
        expect(response.headers.get('Content-Type')).toBe(contentType);
        expect(response.headers.get('X-Powered-By')).toBe(poweredBy);
        expect(response.headers.get('X-Page-Rule')).toBe(pageRule);
        expect(response.headers.get('Set-Cookie')).toBe(setCookie);
        expect(response.headers.get('Cache-Control')).toBe(cacheControl);
        expect(response.headers.get('X-Global')).toBe(status === 200 ? 'global' : null);
      }
    );

    it('does not apply headers to static assets', async () => {
      const files = findProjectFiles(server.outputDir);
      const asset = files.find((file) => file.startsWith('_expo/static/js/web/'));
      expect(asset).toBeDefined();

      const response = await server.fetchAsync(`/${asset}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('X-Global')).toBeNull();
      expect(response.headers.get('Set-Cookie')).toBeNull();
    });
  });
});
