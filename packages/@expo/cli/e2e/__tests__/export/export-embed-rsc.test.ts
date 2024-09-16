/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'path';
import * as fs from 'fs';
import { sync as globSync } from 'glob';

import { runExportSideEffects } from './export-side-effects';
import { bin, getRouterE2ERoot } from '../utils';
import { remove } from 'fs-extra';

runExportSideEffects();

describe('export embed for RSC iOS', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-export-embed-rsc';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await remove(outputDir);

      await execa(
        'node',
        [
          bin,
          'export:embed',
          //
          '--entry-file',
          path.join(projectRoot, './index.js'),
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

            E2E_ROUTER_SRC: 'rsc',
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
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has expected files', async () => {
    // List output files with sizes for snapshotting.
    // This is to make sure that any changes to the output are intentional.
    // Posix path formatting is used to make paths the same across OSes.
    const files = klawSync(outputDir)
      .map((entry) => {
        if (entry.path.includes('node_modules') || !entry.stats.isFile()) {
          return null;
        }
        return path.posix.relative(outputDir, entry.path);
      })
      .filter(Boolean);
    console.log(files);

    expect(
      await fs.promises.readFile(path.resolve(outputDir, '_flight/ios/index.txt'), 'utf8')
    ).toMatchSnapshot();

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
});
