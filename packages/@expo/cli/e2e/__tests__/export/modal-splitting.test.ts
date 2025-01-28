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

describe('exports static splitting with modal', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-modal-splitting';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'web', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'modal-splitting',
        E2E_ROUTER_ASYNC: 'production',
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });
  });

  it('has expected files', async () => {
    const files = findProjectFiles(outputDir);

    // The wrapper should not be included as a route.
    expect(files).not.toContain('+html.html');
    expect(files).not.toContain('_layout.html');

    // Injected by framework
    expect(files).toContain('_sitemap.html');
    expect(files).toContain('+not-found.html');

    // Normal routes
    expect(files).toContain('index.html');
    expect(files).toContain('modal.html');
  });

  const { getScriptTagsAsync } = getHtmlHelpers(outputDir);

  // Ensure the correct script tags are injected.
  it('has eager script tags in html', async () => {
    expect(await getScriptTagsAsync('index.html')).toEqual(
      ['entry', '_layout', 'index'].map(expectChunkPathMatching)
    );
  });

  // Ensure the scripts from the initial route are injected.
  it('has eager scripts for modal with initial route', async () => {
    const indexScripts = await getScriptTagsAsync('index.html');
    const modalScripts = await getScriptTagsAsync('modal.html');
    expect(modalScripts).toEqual(
      ['entry', '_layout', 'index', 'modal'].map(expectChunkPathMatching)
    );

    // Ensure modal scripts is a subset of index scripts
    expect(indexScripts.every((script) => modalScripts.includes(script))).toBe(true);
  });
});
