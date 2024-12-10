/* eslint-env jest */
import JsonFile from '@expo/json-file';
import fs from 'fs';
import type { BasicSourceMap } from 'metro-source-map';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { executeExpoAsync } from '../../utils/expo';
import { findProjectFiles, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports with serializer plugins', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-splitting-plugins';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(async () => {
    // E2E_USE_MOCK_SERIALIZER_PLUGIN=1 NODE_ENV=production EXPO_USE_STATIC=static E2E_ROUTER_SRC=static-rendering E2E_ROUTER_ASYNC=production EXPO_USE_FAST_RESOLVER=1 npx expo export -p web --source-maps --output-dir dist-static-splitting-plugins
    await executeExpoAsync(
      projectRoot,
      ['export', '-p', 'web', '--source-maps', '--output-dir', outputName],
      {
        env: {
          NODE_ENV: 'production',
          E2E_USE_MOCK_SERIALIZER_PLUGINS: '1',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'modal-splitting',
          E2E_ROUTER_ASYNC: 'production',
          EXPO_USE_FAST_RESOLVER: '1',
        },
      }
    );
  });

  it('has source maps', async () => {
    const files = findProjectFiles(outputDir);
    const mapFiles = files.filter((file) => file?.endsWith('.map'));

    // "_expo/static/js/web/_layout-e67451b6ca1f415eec1baf46b17d16c6.js.map",
    expect(mapFiles).toEqual(
      ['_layout', 'entry', 'index', 'modal'].map((file) =>
        expect.stringMatching(new RegExp(`_expo\\/static\\/js\\/web\\/${file}-.*\\.js\\.map`))
      )
    );

    for (const file of mapFiles) {
      // Ensure the bundle does not contain a source map reference
      const sourceMap = JSON.parse(fs.readFileSync(path.join(outputDir, file!), 'utf8'));
      expect(sourceMap.version).toBe(3);
    }

    const jsFiles = files.filter((file) => file?.endsWith('.js'));

    for (const file of jsFiles) {
      // Ensure the bundle does not contain a source map reference
      const jsBundle = fs.readFileSync(path.join(outputDir, file!), 'utf8');
      expect(jsBundle).toMatch(/^\/\/\# sourceMappingURL=\/_expo\/static\/js\/web\/.*\.js\.map$/gm);
      const mapFile = jsBundle.match(
        /^\/\/\# sourceMappingURL=(\/_expo\/static\/js\/web\/.*\.js\.map)$/m
      )?.[1];

      expect(fs.existsSync(path.join(outputDir, mapFile!))).toBe(true);
    }
  });

  it('source maps do not contain project paths', async () => {
    const files = findProjectFiles(outputDir).filter((file) => file.endsWith('.map'));

    // Ensure the source map is available
    expect(files).not.toEqual([]);

    // Load the sourcemap and parse it as JSON
    const rawmap = await JsonFile.readAsync(path.resolve(outputDir, files[0]));
    const sourcemap = rawmap as unknown as BasicSourceMap;

    // Ensure the sourcemap does not contain absolute paths to the project directory
    expect(sourcemap.sources).not.toEqual(
      expect.arrayContaining([expect.stringContaining(projectRoot)])
    );
  });
});
