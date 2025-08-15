/* eslint-env jest */
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import {
  expectChunkPathMatching,
  findProjectFiles,
  getHtmlHelpers,
  getRouterE2ERoot,
} from '../utils';

runExportSideEffects();

describe('export web-modal example', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-web-modal';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'web-modal',
        E2E_ROUTER_ASYNC: 'production',
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });
  });

  it('generates expected route files', async () => {
    const files = findProjectFiles(outputDir);

    expect(files).toContain('index.html');
    expect(files).toContain('modal.html');
    expect(files).toContain('modal-multi.html');
    expect(files).toContain('modal-scroll.html');
  });

  const { getScriptTagsAsync } = getHtmlHelpers(outputDir);

  it('injects correct scripts', async () => {
    expect(await getScriptTagsAsync('index.html')).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index'].map(expectChunkPathMatching)
    );
    expect(await getScriptTagsAsync('modal.html')).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index', 'modal'].map(
        expectChunkPathMatching
      )
    );
    expect(await getScriptTagsAsync('modal-multi.html')).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index', 'modal-multi'].map(
        expectChunkPathMatching
      )
    );
    expect(await getScriptTagsAsync('modal-scroll.html')).toEqual(
      ['__expo-metro-runtime', '__common', 'entry', '_layout', 'index', 'modal-scroll'].map(
        expectChunkPathMatching
      )
    );
  });
});
