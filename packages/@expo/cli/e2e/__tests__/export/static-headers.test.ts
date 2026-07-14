/* eslint-env jest */
import fs from 'node:fs';
import path from 'node:path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

const GLOBAL_HEADERS = {
  'X-Powered-By': 'expo-server',
  'X-Global': 'global',
  'Set-Cookie': ['session=1'],
};

const PAGE_HEADERS = [
  { source: '/', headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' } },
  { source: '/api', headers: { 'Set-Cookie': ['page=1'] } },
  { source: '/blog', headers: { 'Cache-Control': 'no-store', 'X-Page-Rule': 'blog' } },
];

const EXPECTED_PAGE_HEADERS = [
  {
    namedRegex: '^/(?:/)?$',
    headers: { 'X-Page-Rule': 'index', 'X-Powered-By': 'page-override' },
  },
  {
    namedRegex: '^/api(?:/)?$',
    headers: { 'Set-Cookie': ['page=1'] },
  },
  {
    namedRegex: '^/blog(?:/)?$',
    headers: { 'Cache-Control': 'no-store', 'X-Page-Rule': 'blog' },
  },
  // Synthesized from the blog loader's `Response`; positioned after the author rules so the
  // loader-declared `Cache-Control` wins over the `/blog` rule above.
  {
    namedRegex: '^/blog(?:/)?$',
    headers: { 'Cache-Control': 'public, max-age=604800' },
  },
  // The same declaration also targets the loader data file, replacing the host's synthetic
  // asset default.
  {
    namedRegex: '^/_expo/loaders/blog(?:/)?$',
    headers: { 'Cache-Control': 'public, max-age=604800' },
  },
];

describe('export static with headers', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-headers';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'server-headers',
        E2E_ROUTER_ASYNC: '',
        E2E_ROUTER_HEADERS: JSON.stringify(GLOBAL_HEADERS),
        E2E_ROUTER_PAGE_HEADERS: JSON.stringify(PAGE_HEADERS),
        E2E_ROUTER_SERVER_LOADERS: 'true',
      },
    });
  });

  it('writes global headers and pageHeaders into the export manifest', () => {
    const routesJson = JSON.parse(
      fs.readFileSync(path.join(outputDir, '_expo/.routes.json'), 'utf8')
    );
    expect(routesJson.headers).toEqual(GLOBAL_HEADERS);
    expect(routesJson.pageHeaders).toEqual(EXPECTED_PAGE_HEADERS);
  });
});
