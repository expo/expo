import type { ExpoConfig } from 'expo/config';
import type { ExportedConfig, ExportedConfigWithProps } from 'expo/config-plugins';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { withAssetsAndroid } from '../withAssetsAndroid';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningForPlatform: jest.fn() },
  };
});

/** Runs the plugin's `android` dangerous mod the way `expo prebuild` would. */
async function runAndroidMod(assets: string[], projectRoot: string) {
  const platformProjectRoot = path.join(projectRoot, 'android');
  const config = withAssetsAndroid(
    { name: 'test', slug: 'test' } as ExpoConfig,
    assets
  ) as ExportedConfig;
  const mod = config.mods?.android?.dangerous;

  if (!mod) {
    throw new Error('withAssetsAndroid did not register an android dangerous mod');
  }

  await mod({
    ...config,
    modRequest: { projectRoot, platformProjectRoot },
  } as unknown as ExportedConfigWithProps);

  return platformProjectRoot;
}

describe(withAssetsAndroid, () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-asset-android-'));
    await fs.mkdir(path.join(projectRoot, 'assets'), { recursive: true });
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  it('copies an asset whose extension is not one of the built-in types', async () => {
    await fs.writeFile(path.join(projectRoot, 'assets', 'model.onnx'), 'onnx');

    const platformProjectRoot = await runAndroidMod(['./assets/model.onnx'], projectRoot);

    await expect(
      fs.readFile(
        path.join(platformProjectRoot, 'app', 'src', 'main', 'assets', 'model.onnx'),
        'utf8'
      )
    ).resolves.toBe('onnx');
  });

  it('routes images and media to their resource directories', async () => {
    await fs.writeFile(path.join(projectRoot, 'assets', 'image.png'), 'png');
    await fs.writeFile(path.join(projectRoot, 'assets', 'clip.mp4'), 'mp4');

    const platformProjectRoot = await runAndroidMod(
      ['./assets/image.png', './assets/clip.mp4'],
      projectRoot
    );

    const res = path.join(platformProjectRoot, 'app', 'src', 'main', 'res');
    await expect(fs.readFile(path.join(res, 'drawable', 'image.png'), 'utf8')).resolves.toBe('png');
    await expect(fs.readFile(path.join(res, 'raw', 'clip.mp4'), 'utf8')).resolves.toBe('mp4');
  });

  it('copies the files of a directory without failing on nested directories', async () => {
    const assetsDir = path.join(projectRoot, 'assets');
    await fs.mkdir(path.join(assetsDir, 'nested'), { recursive: true });
    await fs.writeFile(path.join(assetsDir, 'model.onnx'), 'onnx');
    await fs.writeFile(path.join(assetsDir, 'nested', 'inner.onnx'), 'inner');

    const platformProjectRoot = await runAndroidMod(['./assets'], projectRoot);

    const androidAssets = path.join(platformProjectRoot, 'app', 'src', 'main', 'assets');
    await expect(fs.readFile(path.join(androidAssets, 'model.onnx'), 'utf8')).resolves.toBe('onnx');
    await expect(fs.readdir(androidAssets)).resolves.toEqual(['model.onnx']);
  });
});
