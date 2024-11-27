/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { bin, findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports static without sourcemaps', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering-no-map';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    await execa('node', [bin, 'export', '-p', 'web', '--output-dir', outputName], {
      cwd: projectRoot,
      env: {
        NODE_ENV: 'production',
        EXPO_USE_STATIC: 'static',
        E2E_ROUTER_SRC: 'url-polyfill',
        E2E_ROUTER_ASYNC: 'development',
        EXPO_USE_FAST_RESOLVER: 'true',
      },
    });
  });

  it('has no reference to source maps', async () => {
    const files = findProjectFiles(outputDir);

    // No map files should exist
    expect(files.some((file) => file.endsWith('.map'))).toBe(false);

    const jsFiles = files.filter((file) => file.endsWith('.js'));

    for (const file of jsFiles) {
      // Ensure the bundle does not contain a source map reference
      const jsBundle = fs.readFileSync(path.join(outputDir, file!), 'utf8');
      expect(jsBundle).not.toMatch('//# sourceMappingURL');
      expect(jsBundle).not.toMatch('//# sourceURL');
    }
  });
});
