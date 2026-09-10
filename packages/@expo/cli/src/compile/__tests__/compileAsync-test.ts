import { compileAndroid, compileIos, type CompileRequest } from '@ramonclaudio/compile';
import { vol } from 'memfs';

import { loadEnvFiles } from '../../utils/nodeEnv';
import { compileAsync } from '../compileAsync';
import { assertAndroidArtifactAbisAsync, resolveAndroidDeviceAsync } from '../resolveAndroidDevice';

jest.mock('@ramonclaudio/compile');
jest.mock('../../utils/nodeEnv');
jest.mock('../resolveAndroidDevice');

const originalPlatform = process.platform;

beforeEach(() => {
  jest.resetAllMocks();
  vol.mkdirSync('/app', { recursive: true });
  Object.defineProperty(process, 'platform', { value: 'darwin' });
});

afterEach(() => {
  vol.reset();
  Object.defineProperty(process, 'platform', { value: originalPlatform });
});

it.each(['development', 'production'] as const)(
  'loads %s environment files before compiling Android and returns its artifacts',
  async (mode) => {
    const request: CompileRequest = {
      platform: 'android',
      cwd: '/app',
      mode,
      outputType: 'apk',
      outputDir: undefined,
    };
    jest.mocked(compileAndroid).mockImplementation(async () => {
      expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode, silent: true });
      return ['/app/arm64.apk', '/app/x86.apk'];
    });
    await expect(compileAsync(request)).resolves.toEqual(['/app/arm64.apk', '/app/x86.apk']);
    expect(compileAndroid).toHaveBeenCalledWith(request, { outputMode: 'quiet' });
    expect(compileIos).not.toHaveBeenCalled();
    expect(resolveAndroidDeviceAsync).not.toHaveBeenCalled();
    expect(assertAndroidArtifactAbisAsync).not.toHaveBeenCalled();
  }
);

it('compiles iOS without starting a packager or skipping the native bundle phase', async () => {
  const request: CompileRequest = {
    platform: 'ios',
    cwd: '/app',
    mode: 'production',
    outputType: 'ipa',
    outputDir: '/artifacts',
    destination: { kind: 'device' },
  };
  jest.mocked(compileIos).mockResolvedValue(['/artifacts/app.ipa']);
  await expect(compileAsync(request)).resolves.toEqual(['/artifacts/app.ipa']);
  expect(compileIos).toHaveBeenCalledWith(request, {
    outputMode: 'quiet',
    env: { ...process.env, RCT_NO_LAUNCH_PACKAGER: 'true' },
  });
  expect(compileAndroid).not.toHaveBeenCalled();
});

it('does not compile when loading environment files fails', async () => {
  const failure = new Error('environment file could not be read');
  jest.mocked(loadEnvFiles).mockImplementation(() => {
    throw failure;
  });
  await expect(
    compileAsync({
      platform: 'android',
      cwd: '/app',
      mode: 'development',
      outputType: 'apk',
      outputDir: undefined,
    })
  ).rejects.toBe(failure);
  expect(compileAndroid).not.toHaveBeenCalled();
  expect(compileIos).not.toHaveBeenCalled();
});

it('rejects iOS on other hosts before loading or changing the project', async () => {
  Object.defineProperty(process, 'platform', { value: 'linux' });
  await expect(
    compileAsync({
      platform: 'ios',
      cwd: '/app',
      mode: 'development',
      outputType: 'app',
      outputDir: undefined,
      destination: { kind: 'simulator' },
    })
  ).rejects.toThrow('iOS compilation requires macOS and Xcode.');
  expect(loadEnvFiles).not.toHaveBeenCalled();
  expect(compileIos).not.toHaveBeenCalled();
});

it.each(['/missing', '/app/file'])(
  'rejects an invalid project directory %s before compilation',
  async (cwd) => {
    vol.writeFileSync('/app/file', 'not a directory');
    await expect(
      compileAsync({
        platform: 'android',
        cwd,
        mode: 'development',
        outputType: 'apk',
        outputDir: undefined,
      })
    ).rejects.toThrow(`Invalid project directory: ${cwd}`);
    expect(loadEnvFiles).not.toHaveBeenCalled();
    expect(compileAndroid).not.toHaveBeenCalled();
  }
);

it.each(['development', 'production'] as const)(
  'targets an Android device without changing %s mode or project environment',
  async (mode) => {
    const envBefore = { ...process.env };
    const request = {
      platform: 'android' as const,
      cwd: '/app',
      mode,
      outputType: 'apk' as const,
      outputDir: '/artifacts',
    };
    jest.mocked(resolveAndroidDeviceAsync).mockImplementation(async () => {
      expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode, silent: true });
      return ['arm64-v8a', 'armeabi-v7a'];
    });
    jest.mocked(compileAndroid).mockResolvedValue(['/artifacts/app.apk']);
    await expect(compileAsync({ ...request, device: '192.168.1.4:5555' })).resolves.toEqual([
      '/artifacts/app.apk',
    ]);
    expect(resolveAndroidDeviceAsync).toHaveBeenCalledWith('192.168.1.4:5555');
    expect(compileAndroid).toHaveBeenCalledWith(request, {
      outputMode: 'quiet',
      env: {
        ...envBefore,
        'ORG_GRADLE_PROJECT_android.injected.build.abi': 'arm64-v8a,armeabi-v7a',
      },
    });
    expect(assertAndroidArtifactAbisAsync).toHaveBeenCalledWith(
      ['/artifacts/app.apk'],
      ['arm64-v8a', 'armeabi-v7a']
    );
    expect(process.env).toEqual(envBefore);
  }
);

it('does not build when Android device selection fails', async () => {
  const failure = new Error('Device is unauthorized');
  jest.mocked(resolveAndroidDeviceAsync).mockRejectedValue(failure);
  await expect(
    compileAsync({
      platform: 'android',
      cwd: '/app',
      mode: 'development',
      outputType: 'apk',
      outputDir: undefined,
      device: 'generic',
    })
  ).rejects.toBe(failure);
  expect(compileAndroid).not.toHaveBeenCalled();
  expect(assertAndroidArtifactAbisAsync).not.toHaveBeenCalled();
});

it('does not return incompatible device artifacts', async () => {
  jest.mocked(resolveAndroidDeviceAsync).mockResolvedValue(['arm64-v8a']);
  jest.mocked(compileAndroid).mockResolvedValue(['/app/x86.apk']);
  const failure = new Error('APK does not support the device architecture');
  jest.mocked(assertAndroidArtifactAbisAsync).mockRejectedValue(failure);
  await expect(
    compileAsync({
      platform: 'android',
      cwd: '/app',
      mode: 'development',
      outputType: 'apk',
      outputDir: undefined,
      device: 'generic',
    })
  ).rejects.toBe(failure);
});
