/* eslint-env jest */
import JsonFile from '@expo/json-file';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports with url-polyfill', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-url-polyfill';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'ios', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'url-polyfill',
        E2E_ROUTER_ASYNC: 'development',
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });
  });

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
  });
});
