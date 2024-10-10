/* eslint-env jest */
import execa from 'execa';
import klawSync from 'klaw-sync';
import path from 'path';
import fs from 'fs';

import { runExportSideEffects } from './export-side-effects';
import { bin, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('static-rendering with a custom asset prefix url', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-rendering-asset-prefix-url';
  const outputDir = path.join(projectRoot, outputName);

  it(
    'asset httpServerFileLocation contains assetPrefix',
    async () => {
      await execa('node', [bin, 'export', '-p', 'web', '--max-workers=1', '--output-dir', outputName], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'asset',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
          EXPO_E2E_ASSET_PREFIX: 'https://cdn.example.dev',
        },
      });

      const bundleFile = klawSync(outputDir)
        .find((entry) => entry.path.match(/\_expo\/static\/js\/web\/index-.*\.js/));

      expect(bundleFile).toBeDefined();

      // Load the bundle to test the asset data on
      const bundleContent = fs.readFileSync(bundleFile?.path!, 'utf8');

      // Ensure that our URL is listed as httpServerLocation in the JS
      expect(bundleContent).toMatch(
        /httpServerLocation\:"https\:\/\/cdn\.example\.dev\/assets\/__e2e__\/asset\/assets\"\,.*name\:\"react-logo/i,
      );
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );
});
