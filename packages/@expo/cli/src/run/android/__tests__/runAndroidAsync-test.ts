import { vol } from 'memfs';

import { exportEagerAsync } from '../../../export/embed/exportEager';
import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { AndroidDeviceManager } from '../../../start/platforms/android/AndroidDeviceManager';
import { installAsync } from '../../../start/platforms/android/gradle';
import {
  resolveBuildCache,
  resolveBuildCacheProvider,
  uploadBuildCache,
} from '../../../utils/build-cache-providers';
import { loadEnvFiles } from '../../../utils/nodeEnv';
import { ensurePortAvailabilityAsync } from '../../../utils/port';
import { startBundlerAsync } from '../../startBundler';
import { compileAndroidAsync } from '../compileAndroidAsync';
import { resolveDeviceAsync } from '../resolveDevice';
import { resolveInstallApkPathAsync } from '../resolveInstallApkPath';
import { runAndroidAsync } from '../runAndroidAsync';

jest.mock('../../../log');
jest.mock('../../../utils/port');
jest.mock('../../../utils/nodeEnv', () => ({ loadEnvFiles: jest.fn() }));
jest.mock('../../../export/embed/exportEager', () => ({
  exportEagerAsync: jest.fn(async () => ({})),
}));
jest.mock('../../../utils/build-cache-providers', () => ({
  resolveBuildCache: jest.fn(),
  resolveBuildCacheProvider: jest.fn(),
  uploadBuildCache: jest.fn(),
}));
jest.mock('../../../start/platforms/android/gradle', () => ({ installAsync: jest.fn() }));
jest.mock('../compileAndroidAsync', () => ({ compileAndroidAsync: jest.fn() }));
jest.mock('../resolveInstallApkPath', () => ({ resolveInstallApkPathAsync: jest.fn() }));
jest.mock('../resolveDevice', () => ({
  resolveDeviceAsync: jest.fn(async () => ({
    device: { name: 'mock', pid: '123' },
    installAppAsync: jest.fn(),
  })),
}));
jest.mock('../../../utils/env', () => ({
  env: { CI: false },
  envIsHeadless: () => false,
}));
jest.mock('../../startBundler', () => ({
  startBundlerAsync: jest.fn(() => ({
    startAsync: jest.fn(),
    stopAsync: jest.fn(),
    getDefaultDevServer: jest.fn(() => ({ openCustomRuntimeAsync: jest.fn() })),
  })),
}));

const binary = '/custom/build/app.apk';
const provider = {
  plugin: { resolveBuildCache: jest.fn(), uploadBuildCache: jest.fn() },
  options: {},
};

beforeEach(() => {
  vol.fromJSON(
    {
      ...rnFixture,
      '/package.json': JSON.stringify({}),
      'node_modules/expo/package.json': JSON.stringify({ version: '53.0.0' }),
      [binary]: 'apk',
    },
    '/'
  );
  jest.mocked(compileAndroidAsync).mockResolvedValue([binary]);
  jest.mocked(resolveInstallApkPathAsync).mockResolvedValue(binary);
  jest.mocked(resolveBuildCacheProvider).mockResolvedValue(undefined);
  jest.mocked(resolveBuildCache).mockResolvedValue(null);
  jest.mocked(ensurePortAvailabilityAsync).mockResolvedValue(true);
});

afterEach(() => vol.reset());

it('builds, installs the reported APK, and starts the runtime', async () => {
  await runAndroidAsync('/', {});

  expect(compileAndroidAsync).toHaveBeenCalledWith('/android', {
    appName: 'app',
    buildCache: false,
    port: 8081,
    variant: 'debug',
    architectures: '',
  });
  const device = await jest.mocked(resolveDeviceAsync).mock.results[0]!.value;
  expect(resolveInstallApkPathAsync).toHaveBeenCalledWith(device.device, [binary]);
  expect(device.installAppAsync).toHaveBeenCalledWith(binary);
  expect(installAsync).not.toHaveBeenCalled();
  expect(startBundlerAsync).toHaveBeenCalledWith(
    '/',
    expect.objectContaining({ mode: 'development' })
  );
  const manager = await jest.mocked(startBundlerAsync).mock.results[0]!.value;
  const server = jest.mocked(manager.getDefaultDevServer).mock.results[0]!.value;
  expect(server.openCustomRuntimeAsync).toHaveBeenCalledWith(
    'emulator',
    {
      applicationId: 'com.bacon.mydevicefamilyproject',
      customAppId: undefined,
      launchActivity: 'com.bacon.mydevicefamilyproject/.MainActivity',
    },
    { device: device.device }
  );
});

it('keeps eager production bundling and the selected variant', async () => {
  await runAndroidAsync('/', { variant: 'demoRelease' });

  expect(loadEnvFiles).toHaveBeenCalledWith('/', { mode: 'production' });
  expect(exportEagerAsync).toHaveBeenCalledWith('/', { dev: false, platform: 'android' });
  expect(compileAndroidAsync).toHaveBeenCalledWith(
    '/android',
    expect.objectContaining({ variant: 'demoRelease', eagerBundleOptions: '{}' })
  );
  expect(startBundlerAsync).toHaveBeenCalledWith(
    '/',
    expect.objectContaining({ mode: 'production' })
  );
});

it('uses Gradle to install when no APK is selected', async () => {
  jest.mocked(resolveInstallApkPathAsync).mockResolvedValueOnce(null);
  await runAndroidAsync('/', {});
  expect(installAsync).toHaveBeenCalledWith('/android', {
    appName: 'app',
    port: 8081,
    variant: 'debug',
    deviceId: '123',
    architectures: '',
    eagerBundleOptions: undefined,
  });
});

it('skips compilation and artifact selection for --binary', async () => {
  await runAndroidAsync('/', { binary });
  expect(compileAndroidAsync).not.toHaveBeenCalled();
  expect(resolveInstallApkPathAsync).not.toHaveBeenCalled();
  expect(resolveBuildCache).not.toHaveBeenCalled();
  const device = await jest.mocked(resolveDeviceAsync).mock.results[0]!.value;
  expect(device.installAppAsync).toHaveBeenCalledWith(binary);
});

it('installs a cache hit without compiling or uploading it again', async () => {
  jest.mocked(resolveBuildCacheProvider).mockResolvedValueOnce(provider);
  jest.mocked(resolveBuildCache).mockResolvedValueOnce(binary);
  await runAndroidAsync('/', {});
  expect(compileAndroidAsync).not.toHaveBeenCalled();
  expect(resolveInstallApkPathAsync).not.toHaveBeenCalled();
  expect(uploadBuildCache).not.toHaveBeenCalled();
  const device = await jest.mocked(resolveDeviceAsync).mock.results[0]!.value;
  expect(device.installAppAsync).toHaveBeenCalledWith(binary);
});

it('uploads the selected artifact after a successful build', async () => {
  jest.mocked(resolveBuildCacheProvider).mockResolvedValueOnce(provider);
  await runAndroidAsync('/', {});
  expect(uploadBuildCache).toHaveBeenCalledWith({
    projectRoot: '/',
    platform: 'android',
    provider,
    buildPath: binary,
    runOptions: { binary, bundler: true },
  });
});

it('stops before bundler startup and installation when compilation fails', async () => {
  const error = new Error('Native build failed');
  jest.mocked(compileAndroidAsync).mockRejectedValueOnce(error);
  await expect(runAndroidAsync('/', {})).rejects.toBe(error);
  expect(startBundlerAsync).not.toHaveBeenCalled();
  expect(installAsync).not.toHaveBeenCalled();
  expect(uploadBuildCache).not.toHaveBeenCalled();
});

it('uses a headless bundler when the port becomes occupied during compilation', async () => {
  jest.mocked(ensurePortAvailabilityAsync).mockResolvedValueOnce(false);
  await runAndroidAsync('/', {});
  expect(startBundlerAsync).toHaveBeenCalledWith('/', expect.objectContaining({ headless: true }));
});

it('keeps build options and the selected device when production install falls back to Gradle', async () => {
  jest.mocked(resolveInstallApkPathAsync).mockResolvedValueOnce(null);
  await runAndroidAsync('/', { variant: 'demoRelease' });

  const buildOptions = jest.mocked(compileAndroidAsync).mock.calls[0]![1];
  expect(installAsync).toHaveBeenCalledWith('/android', {
    variant: buildOptions.variant,
    appName: buildOptions.appName,
    port: buildOptions.port,
    architectures: buildOptions.architectures,
    eagerBundleOptions: '{}',
    deviceId: '123',
  });
});

it('does not let Gradle install on unspecified devices', async () => {
  jest.mocked(resolveInstallApkPathAsync).mockResolvedValueOnce(null);
  jest.mocked(resolveDeviceAsync).mockResolvedValueOnce(
    new AndroidDeviceManager({
      name: 'detached',
      type: 'emulator',
      isAuthorized: true,
      isBooted: false,
      isLaunchable: true,
    })
  );

  await expect(runAndroidAsync('/', {})).rejects.toThrow(
    'The selected Android device has no serial.'
  );
  expect(installAsync).not.toHaveBeenCalled();
});
