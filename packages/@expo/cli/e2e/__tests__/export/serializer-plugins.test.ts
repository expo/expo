/* eslint-env jest */
import execa from 'execa';
import fs from 'fs-extra';
import klawSync from 'klaw-sync';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import {
  bin,
  expectChunkPathMatching,
  getHtmlHelpers,
  getPageHtml,
  getRouterE2ERoot,
} from '../utils';

runExportSideEffects();

describe('exports with serializer plugins', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-splitting-plugins';
  const outputDir = path.join(projectRoot, outputName);

  beforeAll(
    async () => {
      // E2E_USE_MOCK_SERIALIZER_PLUGIN=1 NODE_ENV=production EXPO_USE_STATIC=static E2E_ROUTER_SRC=static-rendering E2E_ROUTER_ASYNC=production EXPO_USE_FAST_RESOLVER=1 npx expo export -p web --source-maps --output-dir dist-static-splitting-plugins
      await execa(
        'node',
        [bin, 'export', '-p', 'web', '--source-maps', '--output-dir', outputName],
        {
          cwd: projectRoot,
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
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has source maps', async () => {
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

    const mapFiles = files.filter((file) => file?.endsWith('.map'));

    // "_expo/static/js/web/_layout-e67451b6ca1f415eec1baf46b17d16c6.js.map",
    expect(mapFiles).toEqual(
      ['_layout', 'index', 'index', 'modal'].map((file) =>
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
});
