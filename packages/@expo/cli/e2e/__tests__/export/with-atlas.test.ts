/* eslint-env jest */
import execa from 'execa';
import { AtlasFileSource } from 'expo-atlas';
import fs from 'fs-extra';
import path from 'path';

import { runExportSideEffects } from './export-side-effects';
import { bin, getRouterE2ERoot } from '../utils';

runExportSideEffects();

describe('exports all platforms with static export', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-static-atlas-file';

  beforeAll(
    async () => {
      await execa('node', [bin, 'export', '-p', 'all', '--output-dir', outputName], {
        cwd: projectRoot,
        env: {
          NODE_ENV: 'production',
          EXPO_USE_STATIC: 'static',
          E2E_ROUTER_SRC: 'url-polyfill',
          E2E_ROUTER_ASYNC: 'development',
          EXPO_USE_FAST_RESOLVER: 'true',
          EXPO_UNSTABLE_ATLAS: 'true',
        },
      });
    },
    // Could take 45s depending on how fast the bundler resolves
    560 * 1000
  );

  it('has .expo/atlas.jsonl file', async () => {
    const filePath = path.join(projectRoot, '.expo', 'atlas.jsonl');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('atlas file contains all platforms', async () => {
    const source = new AtlasFileSource(path.join(projectRoot, '.expo', 'atlas.jsonl'));

    expect(await source.listBundles()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ platform: 'android' }),
        expect.objectContaining({ platform: 'ios' }),
        expect.objectContaining({ platform: 'web' }),
        expect.objectContaining({ platform: 'server' }),
      ])
    );
  });
});
