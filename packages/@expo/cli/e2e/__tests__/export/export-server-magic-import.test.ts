/* eslint-env jest */
import fs from 'fs';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { ExpoServeLocalCommand } from '../../utils/command-instance';
import { bin, execaLog, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('export server with magic import comments', () => {
  const projectRoot = getRouterE2ERoot();
  const inputDir = 'server-magic-import';
  const outputName = 'dist-' + inputDir;
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await execaLog(bin, ['export', '-p', 'web', '--output-dir', outputName], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'server',
          E2E_ROUTER_SRC: inputDir,
          E2E_ROUTER_JS_ENGINE: 'hermes',
        },
      });
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has expected syntax', async () => {
    expect(
      fs.readFileSync(path.resolve(outputDir, 'server/_expo/functions/methods+api.js'), 'utf8')
    ).toMatch(/=await import\('path'\);/);
  });

  describe('server', () => {
    let serveCmd: ExpoServeLocalCommand;
    beforeAll(async () => {
      serveCmd = new ExpoServeLocalCommand(projectRoot, {
        NODE_ENV: 'production',
      });
      await serveCmd.startAsync([outputName, '--port=' + 3037]);
    });

    it('fetches api route to ensure the dynamic import works', async () => {
      const payload = await fetch('http://localhost:3037/methods').then((response) =>
        response.json()
      );
      expect(payload).toEqual({ method: 'get/method' });
    });

    afterAll(async () => {
      await serveCmd.stopAsync();
    });
  });
});
