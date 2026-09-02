import type { ExpoConfig } from 'expo/config';
import { IOSConfig } from 'expo/config-plugins';
import type { ExportedConfig, ExportedConfigWithProps } from 'expo/config-plugins';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

import { withAssetsIos } from '../withAssetsIos';

let mockSourceRoot = '';

jest.mock('@expo/image-utils', () => ({
  generateImageAsync: jest.fn(async () => ({ source: Buffer.from('jpg') })),
}));

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningForPlatform: jest.fn() },
    IOSConfig: {
      ...plugins.IOSConfig,
      Paths: { ...plugins.IOSConfig.Paths, getSourceRoot: () => mockSourceRoot },
      XcodeUtils: {
        ensureGroupRecursively: jest.fn(),
        addResourceFileToGroup: jest.fn(),
      },
    },
  };
});

const addResourceFileToGroup = IOSConfig.XcodeUtils.addResourceFileToGroup as jest.Mock;

/** Runs the plugin's `ios` Xcode mod the way `expo prebuild` would. */
async function runIosMod(assets: string[], projectRoot: string) {
  const config = withAssetsIos(
    { name: 'test', slug: 'test' } as ExpoConfig,
    assets
  ) as ExportedConfig;
  const mod = config.mods?.ios?.xcodeproj;

  if (!mod) {
    throw new Error('withAssetsIos did not register an ios xcodeproj mod');
  }

  await mod({
    ...config,
    modResults: {},
    modRequest: { projectRoot, platformProjectRoot: path.join(projectRoot, 'ios') },
  } as unknown as ExportedConfigWithProps);
}

describe(withAssetsIos, () => {
  let projectRoot: string;

  beforeEach(async () => {
    projectRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'expo-asset-ios-'));
    mockSourceRoot = path.join(projectRoot, 'ios', 'test');
    await fs.mkdir(path.join(projectRoot, 'assets'), { recursive: true });
    await fs.mkdir(mockSourceRoot, { recursive: true });
    addResourceFileToGroup.mockClear();
  });

  afterEach(async () => {
    await fs.rm(projectRoot, { force: true, recursive: true });
  });

  it('routes an uppercase image extension to Images.xcassets', async () => {
    await fs.writeFile(path.join(projectRoot, 'assets', 'photo.JPG'), 'jpg');

    await runIosMod(['./assets/photo.JPG'], projectRoot);

    await expect(
      fs.readFile(
        path.join(mockSourceRoot, 'Images.xcassets', 'photo.imageset', 'photo.JPG'),
        'utf8'
      )
    ).resolves.toBe('jpg');
    expect(addResourceFileToGroup).not.toHaveBeenCalled();
  });
});
