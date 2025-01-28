/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { createExpoServe, executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('export server with magic import comments', () => {
  const projectRoot = getRouterE2ERoot();
  const inputDir = 'server-magic-import';
  const outputName = 'dist-' + inputDir;
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'server',
        E2E_ROUTER_SRC: inputDir,
        E2E_ROUTER_JS_ENGINE: 'hermes',
      },
    });
  });

  it('has expected syntax', async () => {
    expect(
      fs.readFileSync(path.resolve(outputDir, 'server/_expo/functions/methods+api.js'), 'utf8')
    ).toMatch(/=await import\('path'\);/);
  });

  describe('server', () => {
    const expo = createExpoServe({
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
      },
    });

    beforeAll(async () => {
      await expo.startAsync([outputName]);
    });
    afterAll(async () => {
      await expo.stopAsync();
    });

    it('fetches api route to ensure the dynamic import works', async () => {
      const payload = await expo.fetchAsync('/methods').then((response) => response.json());
      expect(payload).toEqual({ method: expect.pathMatching('get/method') });
    });
  });
});
