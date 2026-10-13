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

describe('CocoaPods', () => {
  const iosFiles = Object.fromEntries(
    Object.entries(rnFixture).filter(([file]) => file.startsWith('ios/'))
  );
  const workspace = { isWorkspace: true, name: '/ios/ReactNativeProject.xcworkspace' };

  beforeEach(() => {
    mockPlatform('darwin');
    jest
      .mocked(getLaunchInfoForBinaryAsync)
      .mockResolvedValueOnce({ bundleId: 'com.example.app', schemes: ['example'] });
    jest.mocked(maybePromptToSyncPodsAsync).mockImplementationOnce(async () => {
      vol.fromJSON({ '/ios/ReactNativeProject.xcworkspace/contents.xcworkspacedata': '' });
    });
  });

  afterEach(() => {
    vol.reset();
    jest.mocked(maybePromptToSyncPodsAsync).mockReset();
  });

  function mockProject(files: Record<string, string> = rnFixture) {
    vol.fromJSON(
      {
        ...files,
        '/package.json': JSON.stringify({}),
        'node_modules/expo/package.json': JSON.stringify({ version: '53.0.0' }),
        '/cache/ReactNativeProject.app/Info.plist': '',
      },
      '/'
    );
  }

  function mockBuildCacheProvider(cachedBuildPath: string | null) {
    jest.mocked(resolveBuildCacheProvider).mockResolvedValueOnce({
      plugin: {
        calculateFingerprintHash: async () => 'mock-fingerprint',
        resolveBuildCache: async () => cachedBuildPath,
        uploadBuildCache: async () => null,
      },
      options: {},
    });
  }

  it('prompts for a device before installing pods, then builds the workspace', async () => {
    mockProject();

    await runIosAsync('/', { install: true });

    expect(maybePromptToSyncPodsAsync).toHaveBeenCalledWith('/');
    expect(jest.mocked(maybePromptToSyncPodsAsync).mock.invocationCallOrder[0]).toBeGreaterThan(
      jest.mocked(resolveDeviceAsync).mock.invocationCallOrder[0]!
    );
    expect(buildAsync).toHaveBeenCalledWith(expect.objectContaining({ xcodeProject: workspace }));
  });

  it('prebuilds without pods, then installs pods and builds the workspace', async () => {
    mockProject({});
    jest.mocked(prebuildAsync).mockImplementationOnce(async () => {
      vol.fromJSON(iosFiles, '/');
      return null;
    });

    await runIosAsync('/', { install: true });

    expect(prebuildAsync).toHaveBeenCalledWith('/', {
      install: true,
      skipPodInstall: true,
      platforms: ['ios'],
    });
    expect(maybePromptToSyncPodsAsync).toHaveBeenCalledWith('/');
    expect(buildAsync).toHaveBeenCalledWith(expect.objectContaining({ xcodeProject: workspace }));
  });

  it('does not install pods when the build cache returns a build', async () => {
    mockProject();
    mockBuildCacheProvider('/cache/ReactNativeProject.app');

    await runIosAsync('/', { install: true });

    expect(maybePromptToSyncPodsAsync).not.toHaveBeenCalled();
    expect(launchAppAsync).toHaveBeenCalledWith(
      '/cache/ReactNativeProject.app',
      expect.anything(),
      expect.anything(),
      'com.example.app'
    );
  });

  it('does not install pods or build when --binary is passed', async () => {
    mockProject();

    await runIosAsync('/', { install: true, binary: '/cache/ReactNativeProject.app' });

    expect(maybePromptToSyncPodsAsync).not.toHaveBeenCalled();
    expect(buildAsync).not.toHaveBeenCalled();
    expect(launchAppAsync).toHaveBeenCalledWith(
      '/cache/ReactNativeProject.app',
      expect.anything(),
      expect.anything(),
      'com.example.app'
    );
  });
});
