/* eslint-env jest */
import { AtlasFileSource } from 'expo-atlas';
import fs from 'fs';
import path from 'path';

import { executeExpoAsync } from '../../utils/expo';
import { getRouterE2ERoot } from '../utils';
import { runExportSideEffects } from './export-side-effects';

runExportSideEffects();

describe('exports all platforms with server output', () => {
  const projectRoot = getRouterE2ERoot();
  const outputName = 'dist-server-atlas-file';

  beforeAll(async () => {
    await executeExpoAsync(projectRoot, ['export', '-p', 'all', '--output-dir', outputName], {
      env: {
        NODE_ENV: 'production',
        E2E_ROUTER_SRC: 'url-polyfill',
        E2E_ROUTER_ASYNC: 'development',
        EXPO_ATLAS: 'true',
      },
    });
  });

  it('has .expo/atlas.jsonl file', async () => {
    const filePath = path.join(projectRoot, '.expo', 'atlas.jsonl');
    expect(fs.existsSync(filePath)).toBe(true);
  });

  it('atlas file contains all platforms', async () => {
    const source = new AtlasFileSource(path.join(projectRoot, '.expo', 'atlas.jsonl'));

    expect(await source.listBundles()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ platform: 'android', environment: 'client' }),
        expect.objectContaining({ platform: 'ios', environment: 'client' }),
        expect.objectContaining({ platform: 'web', environment: 'client' }),
        expect.objectContaining({ platform: 'web', environment: 'node' }),
      ])
    );
  });
});
