import { getConfig } from '@expo/config';
import type { ModPlatform } from '@expo/config-plugins';

import { installCocoaPodsAsync } from '../../utils/cocoapods';
import { configureProjectAsync } from '../configureProjectAsync';
import { ensureConfigAsync } from '../ensureConfigAsync';
import { prebuildAsync } from '../prebuildAsync';
import { updateFromTemplateAsync } from '../updateFromTemplate';

jest.mock('@expo/config', () => ({
  getConfig: jest.fn(() => ({ exp: {} })),
}));
jest.mock('@expo/inline-modules', () => ({
  updateXcodeProject: jest.fn(),
}));
jest.mock('../../install/installAsync', () => ({
  installAsync: jest.fn(),
}));
jest.mock('../../utils/cocoapods', () => ({
  installCocoaPodsAsync: jest.fn(async () => true),
}));
jest.mock('../../utils/nodeEnv', () => ({
  setNodeEnv: jest.fn(),
  loadEnvFiles: jest.fn(),
}));
jest.mock('../../utils/ora', () => ({
  logNewSection: jest.fn(() => ({ succeed: jest.fn(), fail: jest.fn() })),
}));
jest.mock('../clearNativeFolder', () => ({
  clearNativeFolder: jest.fn(),
  getExistingNativePlatformsAsync: jest.fn(async () => []),
  promptToClearMalformedNativeProjectsAsync: jest.fn(),
  maybeBailOnNativeModuleAsync: jest.fn(async () => false),
}));
jest.mock('../configureProjectAsync', () => ({
  configureProjectAsync: jest.fn(),
}));
jest.mock('../ensureConfigAsync', () => ({
  ensureConfigAsync: jest.fn(async () => ({ exp: { name: 'testproject' }, pkg: {} })),
}));
jest.mock('../updateFromTemplate', () => ({
  updateFromTemplateAsync: jest.fn(async () => ({
    hasNewProjectFiles: true,
    needsPodInstall: true,
    templateChecksum: 'checksum',
    changedDependencies: [],
  })),
}));

function mockAppPlatforms(platforms?: string[]) {
  jest.mocked(getConfig).mockReturnValue({ exp: { platforms } } as any);
}

describe(prebuildAsync, () => {
  beforeEach(() => {
    mockAppPlatforms();
    jest.mocked(installCocoaPodsAsync).mockResolvedValue(true);
    jest.mocked(ensureConfigAsync).mockResolvedValue({
      exp: { name: 'testproject' },
      pkg: {},
    } as any);
    jest.mocked(updateFromTemplateAsync).mockResolvedValue({
      hasNewProjectFiles: true,
      needsPodInstall: true,
      templateChecksum: 'checksum',
      changedDependencies: [],
    } as any);
  });

  it(`installs CocoaPods in the ios directory when prebuilding for ios`, async () => {
    await prebuildAsync('/', { platforms: ['ios'], install: true });

    expect(installCocoaPodsAsync).toHaveBeenCalledTimes(1);
    expect(installCocoaPodsAsync).toHaveBeenCalledWith('/', { platform: 'ios' });
  });

  it(`installs CocoaPods in the tvos directory when prebuilding for tvos`, async () => {
    await prebuildAsync('/', { platforms: ['tvos' as ModPlatform], install: true });

    expect(installCocoaPodsAsync).toHaveBeenCalledTimes(1);
    expect(installCocoaPodsAsync).toHaveBeenCalledWith('/', { platform: 'tvos' });
  });

  it(`installs CocoaPods in both directories when prebuilding for ios and tvos`, async () => {
    await prebuildAsync('/', { platforms: ['ios', 'tvos' as ModPlatform], install: true });

    expect(installCocoaPodsAsync).toHaveBeenCalledTimes(2);
    expect(installCocoaPodsAsync).toHaveBeenCalledWith('/', { platform: 'ios' });
    expect(installCocoaPodsAsync).toHaveBeenCalledWith('/', { platform: 'tvos' });
  });

  it(`skips CocoaPods when install is disabled`, async () => {
    await prebuildAsync('/', { platforms: ['tvos' as ModPlatform], install: false });

    expect(installCocoaPodsAsync).not.toHaveBeenCalled();
  });

  it(`reports a failed pod install for tvos`, async () => {
    jest.mocked(installCocoaPodsAsync).mockResolvedValue(false);

    const results = await prebuildAsync('/', {
      platforms: ['tvos' as ModPlatform],
      install: true,
    });

    expect(results?.podInstall).toBe(true);
  });

  it(`applies the config to the tvos platform`, async () => {
    await prebuildAsync('/', { platforms: ['tvos' as ModPlatform], install: true });

    expect(configureProjectAsync).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({ platforms: ['tvos'] })
    );
  });
});
