import type { BuildCacheProvider } from '@expo/config';
import { vol } from 'memfs';

import { Log } from '../../../log';
import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { prebuildAsync } from '../../../prebuild/prebuildAsync';
import { resolveBuildCacheProvider } from '../../../utils/build-cache-providers';
import { maybePromptToSyncPodsAsync } from '../../../utils/cocoapods';
import { loadEnvFiles } from '../../../utils/nodeEnv';
import { logProjectLogsLocation } from '../../hints';
import { startBundlerAsync } from '../../startBundler';
import { buildAsync } from '../XcodeBuild';
import type { XcodeConfiguration } from '../XcodeBuild.types';
import { getLaunchInfoForBinaryAsync, launchAppAsync } from '../launchApp';
import { isSimulatorDevice, resolveDeviceAsync } from '../options/resolveDevice';
import { runIosAsync } from '../runIosAsync';

jest.mock('../../hints', () => ({
  logProjectLogsLocation: jest.fn(),
  logDeviceArgument: jest.fn(),
}));

jest.mock('../../../log');

jest.mock('../../../utils/port');
jest.mock('../../../utils/cocoapods', () => ({
  maybePromptToSyncPodsAsync: jest.fn(async () => {}),
}));
jest.mock('../../../prebuild/prebuildAsync', () => ({
  prebuildAsync: jest.fn(async () => null),
}));
jest.mock('../../../utils/build-cache-providers', () => ({
  ...jest.requireActual('../../../utils/build-cache-providers'),
  resolveBuildCacheProvider: jest.fn(async () => undefined),
}));
jest.mock('../../../utils/nodeEnv', () => ({
  loadEnvFiles: jest.fn(),
}));
jest.mock('../../../export/embed/exportEager', () => ({
  exportEagerAsync: jest.fn(async () => ({})),
}));

jest.mock('../options/resolveDevice', () => ({
  isSimulatorDevice: jest.fn(() => true),
  resolveDeviceAsync: jest.fn(async () => ({
    name: 'mock',
    udid: '123',
  })),
}));

jest.mock('../../../utils/env', () => ({
  env: {
    CI: false,
  },
  envIsHeadless: () => false,
}));

jest.mock('../../startBundler', () => ({
  startBundlerAsync: jest.fn(() => ({
    startAsync: jest.fn(),
  })),
}));

jest.mock('../../../start/platforms/ios/AppleDeviceManager', () => ({
  AppleDeviceManager: {
    resolveAsync: async () => ({
      device: {},
    }),
  },
}));

jest.mock('../XcodeBuild', () => ({
  logPrettyItem: jest.fn(),
  buildAsync: jest.fn(async () => '...'),
  getAppBinaryPath: jest.fn(() => '/mock_binary'),
}));

jest.mock('../launchApp', () => ({
  launchAppAsync: jest.fn(async () => {}),
  getLaunchInfoForBinaryAsync: jest.fn(async () => ({})),
}));

const mockPlatform = (value: typeof process.platform) =>
  Object.defineProperty(process, 'platform', {
    value,
  });

const platform = process.platform;

afterEach(() => {
  mockPlatform(platform);
});

describe(runIosAsync, () => {
  afterEach(() => vol.reset());

  it('uses production mode for a release configuration', async () => {
    mockPlatform('darwin');
    vol.fromJSON(
      {
        ...rnFixture,
        '/package.json': JSON.stringify({}),
        'node_modules/expo/package.json': JSON.stringify({
          version: '53.0.0',
        }),
      },
      '/'
    );

    await runIosAsync('/', { configuration: 'Release' });

    expect(loadEnvFiles).toHaveBeenCalledWith('/', { mode: 'production' });
    expect(startBundlerAsync).toHaveBeenCalledWith(
      '/',
      expect.objectContaining({ mode: 'production' })
    );
  });

  it.each([
    { configuration: 'Debug', mode: 'development' },
    { configuration: 'Staging', mode: 'production' },
  ])('uses $mode mode for the $configuration configuration', async ({ configuration, mode }) => {
    mockPlatform('darwin');
    vol.fromJSON(
      {
        ...rnFixture,
        '/package.json': JSON.stringify({}),
        'node_modules/expo/package.json': JSON.stringify({
          version: '53.0.0',
        }),
      },
      '/'
    );

    await runIosAsync('/', { configuration: configuration as XcodeConfiguration });

    expect(loadEnvFiles).toHaveBeenCalledWith('/', { mode });
    expect(startBundlerAsync).toHaveBeenCalledWith('/', expect.objectContaining({ mode }));
  });

  it(`asserts that the function only runs on darwin machines`, async () => {
    mockPlatform('win32');
    await expect(runIosAsync('/', {})).rejects.toThrow(/EXIT_CALLED/);
    expect(Log.exit).toHaveBeenCalledWith(expect.stringMatching(/eas build -p ios/));
  });

  it(`runs ios on simulator`, async () => {
    mockPlatform('darwin');
    vol.fromJSON(
      {
        ...rnFixture,
        '/package.json': JSON.stringify({}),
        'node_modules/expo/package.json': JSON.stringify({
          version: '53.0.0',
        }),
      },
      '/'
    );

    await runIosAsync('/', {});

    expect(buildAsync).toHaveBeenCalledWith({
      buildCache: true,
      buildCacheProvider: undefined,
      configuration: 'Debug',
      device: { name: 'mock', udid: '123' },
      eagerBundleOptions: undefined,
      isSimulator: true,
      osType: 'iOS',
      port: 8081,
      projectRoot: '/',
      scheme: 'ReactNativeProject',
      shouldSkipInitialBundling: false,
      shouldStartBundler: true,
      xcodeProject: { isWorkspace: false, name: '/ios/ReactNativeProject.xcodeproj' },
    });

    expect(launchAppAsync).toHaveBeenCalledWith(
      '/mock_binary',
      expect.anything(),
      {
        device: { name: 'mock', udid: '123' },
        isSimulator: true,
        shouldStartBundler: true,
      },
      undefined
    );

    expect(logProjectLogsLocation).toHaveBeenCalled();
  });

  it(`runs ios on device`, async () => {
    jest.mocked(resolveDeviceAsync).mockResolvedValueOnce({
      name: "Evan's phone",
      model: 'iPhone13,4',
      osVersion: '15.4.1',
      deviceType: 'device',
      udid: '00008101-001964A22629003A',
      connectionType: 'USB',
      osType: 'iOS',
    });
    jest.mocked(isSimulatorDevice).mockReturnValueOnce(false);
    mockPlatform('darwin');
    vol.fromJSON(
      {
        ...rnFixture,
        '/package.json': JSON.stringify({}),
        'node_modules/expo/package.json': JSON.stringify({
          version: '53.0.0',
        }),
      },
      '/'
    );

    await runIosAsync('/', { device: '00008101-001964A22629003A' });

    expect(buildAsync).toHaveBeenCalledWith({
      buildCache: true,
      buildCacheProvider: undefined,
      configuration: 'Debug',
      device: {
        deviceType: 'device',
        model: 'iPhone13,4',
        name: "Evan's phone",
        osVersion: '15.4.1',
        udid: '00008101-001964A22629003A',
        connectionType: 'USB',
        osType: 'iOS',
      },
      eagerBundleOptions: undefined,
      isSimulator: false,
      osType: 'iOS',
      port: 8081,
      projectRoot: '/',
      scheme: 'ReactNativeProject',
      shouldSkipInitialBundling: true,
      shouldStartBundler: true,
      xcodeProject: { isWorkspace: false, name: '/ios/ReactNativeProject.xcodeproj' },
    });

    expect(launchAppAsync).toHaveBeenCalledWith(
      '/mock_binary',
      expect.anything(),
      {
        device: {
          deviceType: 'device',
          model: 'iPhone13,4',
          name: "Evan's phone",
          osVersion: '15.4.1',
          udid: '00008101-001964A22629003A',
          connectionType: 'USB',
          osType: 'iOS',
        },
        isSimulator: false,
        shouldStartBundler: true,
      },
      undefined
    );

    expect(logProjectLogsLocation).toHaveBeenCalled();
  });
});

describe('build cache', () => {
  const physicalDevice = {
    name: "Evan's phone",
    model: 'iPhone13,4',
    osVersion: '15.4.1',
    deviceType: 'device' as const,
    udid: '00008101-001964A22629003A',
    connectionType: 'USB' as const,
    osType: 'iOS' as const,
  };

  beforeEach(() => {
    mockPlatform('darwin');
    jest
      .mocked(getLaunchInfoForBinaryAsync)
      .mockResolvedValueOnce({ bundleId: 'com.example.app', schemes: ['example'] });
  });

  afterEach(() => vol.reset());

  function mockProject({
    withBuildCacheProvider,
    files = rnFixture,
  }: {
    withBuildCacheProvider: boolean;
    files?: Record<string, string>;
  }) {
    vol.fromJSON(
      {
        ...files,
        '/package.json': JSON.stringify({}),
        '/app.json': JSON.stringify({
          expo: withBuildCacheProvider
            ? { buildCacheProvider: { plugin: './provider.plugin.js' } }
            : {},
        }),
        'node_modules/expo/package.json': JSON.stringify({ version: '53.0.0' }),
        '/cache/ReactNativeProject.app/Info.plist': '',
      },
      '/'
    );
  }

  function mockBuildCacheProvider({
    supportsIosPhysicalDevices,
    cachedBuildPath,
  }: {
    supportsIosPhysicalDevices?: boolean;
    cachedBuildPath: string | null;
  }) {
    const provider = {
      plugin: {
        supportsIosPhysicalDevices,
        calculateFingerprintHash: jest.fn(async () => 'mock-fingerprint'),
        resolveBuildCache: jest.fn(async () => cachedBuildPath),
        uploadBuildCache: jest.fn(async () => null),
      },
      options: {},
    } satisfies BuildCacheProvider;
    jest.mocked(resolveBuildCacheProvider).mockResolvedValueOnce(provider);
    return provider.plugin;
  }

  function mockPhysicalDevice() {
    jest.mocked(resolveDeviceAsync).mockResolvedValueOnce(physicalDevice);
    jest.mocked(isSimulatorDevice).mockReturnValueOnce(false);
  }

  function mockPodInstallCreatesWorkspace() {
    jest.mocked(maybePromptToSyncPodsAsync).mockImplementationOnce(async () => {
      vol.fromJSON({ '/ios/ReactNativeProject.xcworkspace/contents.xcworkspacedata': '' });
    });
  }

  it('installs pods before prompting for a device when no provider is configured', async () => {
    mockProject({ withBuildCacheProvider: false });

    await runIosAsync('/', { install: true });

    expect(maybePromptToSyncPodsAsync).toHaveBeenCalledWith('/');
    expect(jest.mocked(maybePromptToSyncPodsAsync).mock.invocationCallOrder[0]).toBeLessThan(
      jest.mocked(resolveDeviceAsync).mock.invocationCallOrder[0]!
    );
    expect(buildAsync).toHaveBeenCalled();
  });

  it('builds locally for a physical device when the provider does not support physical devices', async () => {
    mockProject({ withBuildCacheProvider: true });
    const plugin = mockBuildCacheProvider({ cachedBuildPath: '/cache/ReactNativeProject.app' });
    mockPhysicalDevice();
    mockPodInstallCreatesWorkspace();

    await runIosAsync('/', { install: true, device: physicalDevice.udid });

    expect(plugin.resolveBuildCache).not.toHaveBeenCalled();
    expect(maybePromptToSyncPodsAsync).toHaveBeenCalledWith('/');
    expect(buildAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        xcodeProject: { isWorkspace: true, name: '/ios/ReactNativeProject.xcworkspace' },
      })
    );
    expect(plugin.uploadBuildCache).not.toHaveBeenCalled();
  });

  it('installs the cached build on a physical device without installing pods', async () => {
    mockProject({ withBuildCacheProvider: true });
    const plugin = mockBuildCacheProvider({
      supportsIosPhysicalDevices: true,
      cachedBuildPath: '/cache/ReactNativeProject.app',
    });
    mockPhysicalDevice();

    await runIosAsync('/', { install: true, device: physicalDevice.udid });

    expect(plugin.resolveBuildCache).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: 'ios',
        fingerprintHash: 'mock-fingerprint',
        device: { id: '00008101-001964A22629003A', type: 'device' },
      }),
      {}
    );
    expect(maybePromptToSyncPodsAsync).not.toHaveBeenCalled();
    expect(buildAsync).not.toHaveBeenCalled();
    expect(launchAppAsync).toHaveBeenCalledWith(
      '/cache/ReactNativeProject.app',
      expect.anything(),
      expect.objectContaining({ isSimulator: false }),
      'com.example.app'
    );
  });

  it('installs pods and builds the workspace for a physical device when the cache misses', async () => {
    mockProject({ withBuildCacheProvider: true });
    const plugin = mockBuildCacheProvider({
      supportsIosPhysicalDevices: true,
      cachedBuildPath: null,
    });
    mockPhysicalDevice();
    mockPodInstallCreatesWorkspace();

    await runIosAsync('/', { install: true, device: physicalDevice.udid });

    expect(plugin.resolveBuildCache).toHaveBeenCalled();
    expect(jest.mocked(maybePromptToSyncPodsAsync).mock.invocationCallOrder[0]).toBeGreaterThan(
      plugin.resolveBuildCache.mock.invocationCallOrder[0]!
    );
    expect(buildAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        xcodeProject: { isWorkspace: true, name: '/ios/ReactNativeProject.xcworkspace' },
      })
    );
    expect(launchAppAsync).toHaveBeenCalledWith(
      '/mock_binary',
      expect.anything(),
      expect.anything(),
      'com.example.app'
    );
    expect(plugin.uploadBuildCache).not.toHaveBeenCalled();
  });

  it('installs the cached build on a simulator without installing pods', async () => {
    mockProject({ withBuildCacheProvider: true });
    const plugin = mockBuildCacheProvider({ cachedBuildPath: '/cache/ReactNativeProject.app' });

    await runIosAsync('/', { install: true });

    expect(plugin.resolveBuildCache).toHaveBeenCalledWith(
      expect.objectContaining({ device: { id: '123', type: 'simulator' } }),
      {}
    );
    expect(maybePromptToSyncPodsAsync).not.toHaveBeenCalled();
    expect(buildAsync).not.toHaveBeenCalled();
    expect(launchAppAsync).toHaveBeenCalledWith(
      '/cache/ReactNativeProject.app',
      expect.anything(),
      expect.objectContaining({ isSimulator: true }),
      'com.example.app'
    );
  });

  it('uploads the simulator build when the cache misses', async () => {
    mockProject({ withBuildCacheProvider: true });
    const plugin = mockBuildCacheProvider({ cachedBuildPath: null });

    await runIosAsync('/', { install: true });

    expect(maybePromptToSyncPodsAsync).toHaveBeenCalledWith('/');
    expect(plugin.uploadBuildCache).toHaveBeenCalledWith(
      expect.objectContaining({ buildPath: '/mock_binary', fingerprintHash: 'mock-fingerprint' }),
      {}
    );
  });

  it.each([
    { withBuildCacheProvider: false, skipPodInstall: false },
    { withBuildCacheProvider: true, skipPodInstall: true },
  ])(
    'prebuilds with skipPodInstall: $skipPodInstall when withBuildCacheProvider is $withBuildCacheProvider',
    async ({ withBuildCacheProvider, skipPodInstall }) => {
      const iosFiles = Object.fromEntries(
        Object.entries(rnFixture).filter(([file]) => file.startsWith('ios/'))
      );
      mockProject({ withBuildCacheProvider, files: {} });
      if (withBuildCacheProvider) {
        mockBuildCacheProvider({ cachedBuildPath: '/cache/ReactNativeProject.app' });
      }
      jest.mocked(prebuildAsync).mockImplementationOnce(async () => {
        vol.fromJSON(iosFiles, '/');
        return null;
      });

      await runIosAsync('/', { install: true });

      expect(prebuildAsync).toHaveBeenCalledWith('/', {
        install: true,
        skipPodInstall,
        platforms: ['ios'],
      });
    }
  );
});
