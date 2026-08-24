import { WarningAggregator } from 'expo/config-plugins';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { resolveAssetPaths, validateAssets } from '../utils';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningForPlatform: jest.fn() },
  };
});

const addWarningForPlatform = WarningAggregator.addWarningForPlatform as jest.Mock;

beforeEach(() => {
  addWarningForPlatform.mockClear();
});

describe(validateAssets, () => {
  it.each(['android', 'ios'] as const)(
    'keeps an asset whose extension is not one of the built-in types (%s)',
    (platform) => {
      const asset = path.join('/project', 'assets', 'model.onnx');

      expect(validateAssets([asset], platform)).toEqual([asset]);
      expect(addWarningForPlatform).not.toHaveBeenCalled();
    }
  );

  it.each(['android', 'ios'] as const)(
    'keeps assets whose extension the plugin routes explicitly (%s)',
    (platform) => {
      const assets = [
        path.join('/project', 'assets', 'image.png'),
        path.join('/project', 'assets', 'clip.mp4'),
        path.join('/project', 'assets', 'data.db'),
      ];

      expect(validateAssets(assets, platform)).toEqual(assets);
      expect(addWarningForPlatform).not.toHaveBeenCalled();
    }
  );

  it.each(['android', 'ios'] as const)('drops fonts and points at expo-font (%s)', (platform) => {
    const font = path.join('/project', 'assets', 'inter.ttf');

    expect(validateAssets([font], platform)).toEqual([]);
    expect(addWarningForPlatform).toHaveBeenCalledWith(
      platform,
      'expo-asset',
      expect.stringContaining('expo-font')
    );
  });

  it('drops assets with an invalid Android resource name', () => {
    const asset = path.join('/project', 'assets', 'My-Model.onnx');

    expect(validateAssets([asset], 'android')).toEqual([]);
    expect(addWarningForPlatform).toHaveBeenCalledWith(
      'android',
      'expo-asset',
      expect.stringContaining('is not a supported asset name')
    );
  });

  it('does not apply the Android resource name rule on iOS', () => {
    const asset = path.join('/project', 'assets', 'My-Model.onnx');

    expect(validateAssets([asset], 'ios')).toEqual([asset]);
    expect(addWarningForPlatform).not.toHaveBeenCalled();
  });
});

describe(resolveAssetPaths, () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-asset-plugin-'));
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  it('resolves a relative file path from the project root', async () => {
    const assetPath = path.join(projectRoot, 'assets', 'model.onnx');
    await fs.mkdir(path.dirname(assetPath), { recursive: true });
    await fs.writeFile(assetPath, '');

    await expect(resolveAssetPaths(['./assets/model.onnx'], projectRoot)).resolves.toEqual([
      assetPath,
    ]);
  });

  it('expands a directory to its files, skipping nested directories and hidden files', async () => {
    const assetsDir = path.join(projectRoot, 'assets');
    await fs.mkdir(path.join(assetsDir, 'nested'), { recursive: true });
    await fs.writeFile(path.join(assetsDir, 'model.onnx'), '');
    await fs.writeFile(path.join(assetsDir, 'image.png'), '');
    await fs.writeFile(path.join(assetsDir, '.DS_Store'), '');
    await fs.writeFile(path.join(assetsDir, 'nested', 'inner.onnx'), '');

    const result = await resolveAssetPaths(['./assets'], projectRoot);

    expect(result.sort()).toEqual([
      path.join(assetsDir, 'image.png'),
      path.join(assetsDir, 'model.onnx'),
    ]);
  });

  it('rejects a path that does not exist', async () => {
    await expect(resolveAssetPaths(['./assets/missing.onnx'], projectRoot)).rejects.toThrow();
  });
});
