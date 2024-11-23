/* eslint-env jest */
import JsonFile from '@expo/json-file';
import execa from 'execa';
import fs from 'fs';
import { sync as globSync } from 'glob';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { bin, findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports with react native canary', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-rn-canary';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      await execa(
        'node',
        [bin, 'export', '-p', 'ios', '--output-dir', outputName, '--no-bytecode', '--no-minify'],
        {
          cwd: projectRoot,
          env: {
            NODE_ENV: 'production',
            EXPO_USE_STATIC: 'static',
            E2E_CANARY_ENABLED: '1',
            E2E_ROUTER_JS_ENGINE: 'hermes',
            E2E_ROUTER_SRC: 'react-native-canary',
            E2E_ROUTER_ASYNC: 'development',
            EXPO_USE_FAST_RESOLVER: 'true',
            EXPO_USE_METRO_REQUIRE: '1',
          },
        }
      );
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);
    const metadata = await JsonFile.readAsync(path.resolve(outputDir, 'metadata.json'));

    expect(metadata).toEqual({
      bundler: 'metro',
      fileMetadata: {
        ios: {
          assets: expect.anything(),
          bundle: expect.stringMatching(/_expo\/static\/js\/ios\/entry-.*\.js/),
        },
      },
      version: 0,
    });

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('index.html');

    const iosBundle = files.find((v) => v?.startsWith('_expo/static/js/ios/'));
    expect(iosBundle).toBeDefined();

    // Check if the bundle is minified
    const bundlePath = globSync('**/*.js', {
      cwd: path.join(outputDir, '_expo'),
      absolute: true,
    })[0];

    const bundle = await fs.promises.readFile(bundlePath, 'utf8');
    // Minified mark
    expect(bundle).not.toMatch('__d((function(g,r,');
    // Canary comment. This needs to be updated with each canary.
    expect(bundle).toMatch('canary-full/react/cjs/react.production.js');
  });
});
