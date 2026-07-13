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
