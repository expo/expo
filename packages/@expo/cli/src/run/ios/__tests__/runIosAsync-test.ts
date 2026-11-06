import { vol } from 'memfs';

import { Log } from '../../../log';
import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { loadEnvFiles } from '../../../utils/nodeEnv';
import { logProjectLogsLocation } from '../../hints';
import { startBundlerAsync } from '../../startBundler';
import { buildAsync } from '../XcodeBuild';
import type { XcodeConfiguration } from '../XcodeBuild.types';
import { launchAppAsync } from '../launchApp';
import { isSimulatorDevice, resolveDeviceAsync } from '../options/resolveDevice';
import { runIosAsync } from '../runIosAsync';

jest.mock('../../hints', () => ({
  logProjectLogsLocation: jest.fn(),
  logDeviceArgument: jest.fn(),
}));

jest.mock('../../../log');

jest.mock('../../../utils/port');

const mockInstallPodsAsync = jest.fn(async () => {
  vol.fromJSON({ '/ios/ReactNativeProject.xcworkspace/contents.xcworkspacedata': '' });
});
jest.mock('@expo/package-manager', () => ({
  CocoaPodsPackageManager: jest.fn(() => ({
    isCLIInstalledAsync: jest.fn(async () => true),
    installAsync: mockInstallPodsAsync,
  })),
}));
jest.mock('../../../prebuild/ensureConfigAsync', () => ({
  ensureConfigAsync: jest.fn(async () => ({
    exp: { name: 'ReactNativeProject', slug: 'app' },
    pkg: {},
  })),
}));
jest.mock('../../../prebuild/updateFromTemplate', () => ({
  updateFromTemplateAsync: jest.fn(async () => {
    vol.fromJSON({ ...rnFixture, 'ios/Podfile': '' }, '/');
    return { needsPodInstall: true, changedDependencies: [], hasNewProjectFiles: true };
  }),
}));
jest.mock('../../../prebuild/configureProjectAsync', () => ({
  configureProjectAsync: jest.fn(),
}));
jest.mock('../../../utils/cocoapods.js', () => jest.requireActual('../../../utils/cocoapods'), {
  virtual: true,
});
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

  function mockIosProject(prebuild = false) {
    vol.fromJSON(
      {
        ...(prebuild ? {} : { ...rnFixture, '/ios/Podfile': '' }),
        '/package.json': '{}',
        '/node_modules/expo/package.json': JSON.stringify({ version: '53.0.0' }),
      },
      '/'
    );
  }

  it.each([
    { prebuild: false, scheme: undefined },
    { prebuild: true, scheme: undefined },
    { prebuild: false, scheme: 'CustomSharedScheme' },
  ])('selects the device before pods (%j)', async ({ prebuild, scheme }) => {
    mockPlatform('darwin');
    mockIosProject(prebuild);

    await runIosAsync('/', { install: true, device: true, scheme });

    expect(resolveDeviceAsync).toHaveBeenCalledTimes(1);
    expect(mockInstallPodsAsync).toHaveBeenCalledTimes(1);
    expect(jest.mocked(resolveDeviceAsync).mock.invocationCallOrder[0]).toBeLessThan(
      mockInstallPodsAsync.mock.invocationCallOrder[0]!
    );
    expect(buildAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        scheme: scheme ?? 'ReactNativeProject',
        xcodeProject: { isWorkspace: true, name: '/ios/ReactNativeProject.xcworkspace' },
      })
    );
  });

  it('does not install pods when device selection is cancelled', async () => {
    mockPlatform('darwin');
    mockIosProject();
    jest.mocked(resolveDeviceAsync).mockRejectedValueOnce(new Error('cancelled'));

    await expect(runIosAsync('/', { install: true, device: true })).rejects.toThrow('cancelled');

    expect(mockInstallPodsAsync).not.toHaveBeenCalled();
    expect(buildAsync).not.toHaveBeenCalled();
  });

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
