/* eslint-env jest */
import { resolveRelativeEntryPoint } from '@expo/config/paths';
import fs from 'fs';
import { remove } from 'fs-extra';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { ExpoServeLocalCommand } from '../../utils/command-instance';
import { bin, execaLog, getRouterE2ERoot } from '../utils';
import { createExpoServeServer } from '../../utils/expo-server';

runExportSideEffects();

jest.unmock('resolve-from');

describe('export embed for RSC iOS', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-export-embed-rsc';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await remove(outputDir);
    await remove(path.join(projectRoot, '.expo/server/ios'));

    await execaLog(
      bin,
      [
        'export:embed',
        //
        '--entry-file',
        resolveRelativeEntryPoint(projectRoot, { platform: 'ios' }),
        //
        '--bundle-output',
        `./${outputName}/index.js`,
        '--assets-dest',
        outputName,
        '--platform',
        'ios',
        '--dev',
        'false',

        '--sourcemap-output',
        path.join(projectRoot, `./${outputName}/index.js.map`),

        '--sourcemap-sources-root',
        projectRoot,
      ],
      {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',

          E2E_ROUTER_SRC: '01-rsc',
          E2E_ROUTER_ASYNC: 'development',

          EXPO_USE_STATIC: 'single',
          E2E_ROUTER_JS_ENGINE: 'hermes',

          E2E_RSC_ENABLED: '1',
          E2E_CANARY_ENABLED: '1',
          EXPO_USE_METRO_REQUIRE: '1',
          TEST_SECRET_VALUE: 'test-secret',
        },
      }
    );
  });

  it('has expected files', async () => {
    // Ensure the standard files are included.
    expect(fs.existsSync(path.resolve(outputDir, 'index.js'))).toBe(true);
    expect(fs.existsSync(path.resolve(outputDir, 'assets'))).toBe(true);

    // Ensure the SSG RSC payload is included in the binary
    expect(fs.existsSync(path.resolve(outputDir, '_flight'))).toBe(true);

    // Ensure the secure server files are not included.
    expect(fs.existsSync(path.resolve(outputDir, 'client'))).toBe(false);
    expect(fs.existsSync(path.resolve(outputDir, 'server'))).toBe(false);

    // Check the server project location
    expect(fs.existsSync(path.resolve(projectRoot, '.expo/server/ios'))).toBe(true);
  });

  describe('server', () => {
    const inputDir = '.expo/server/ios';

    const serverOutput = path.resolve(projectRoot, '.expo/server/ios');
    const staticLocation = path.join(serverOutput, 'client/_flight/ios/index.txt');
    const tempStaticLocation = path.join(serverOutput, 'client/_flight/ios/other.txt');

    const serve = createExpoServeServer({
      verbose: true,
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        TEST_SECRET_VALUE: 'test-secret-dynamic',
      },
    });

    beforeAll(async () => {
      console.time('npx serve');
      await serve.startAsync([inputDir]);

      // Move the static file to a temporary location so we can test both static and dynamic RSC payloads.
      if (fs.existsSync(staticLocation)) {
        fs.renameSync(staticLocation, tempStaticLocation);
      }
    });

    it('fetches static RSC payload from server', async () => {
      const payload = await serve.fetchAsync('/_flight/ios/other.txt').then((response) =>
        response.text()
      );
      expect(payload).toMatch('test-secret');
    });

    it('server renders RSC payload from server', async () => {
      const payload = await serve.fetchAsync('/_flight/ios/index.txt', {
        headers: {
          accept: 'text/x-component',
          'expo-platform': 'ios',
        },
      }).then((response) => response.text());
      expect(payload).toMatch('test-secret');
    });

    afterAll(async () => {
      if (fs.existsSync(tempStaticLocation)) {
        fs.renameSync(tempStaticLocation, staticLocation);
      }

      await serve.stopAsync();
    });
  });
});
