import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { Log } from '../../../log';
import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { loadEnvFiles } from '../../../utils/nodeEnv.js';
import { event } from '../../events';
import { expoCompileIos } from '../index';

jest.mock('../../../log');
jest.mock('../../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), { virtual: true });
jest.mock('../../events', () => {
  const done = jest.fn();
  return {
    event: Object.assign(jest.fn(), {
      span: jest.fn(() => done),
      error: jest.fn((error) => error),
      path: jest.fn((path) => path),
    }),
    debugEvent: Object.assign(jest.fn(), { path: jest.fn((path) => path) }),
  };
});
jest.mock('../../resolveMode.js', () => jest.requireActual('../../resolveMode'), {
  virtual: true,
});
jest.mock('../../resolveOptions.js', () => jest.requireActual('../../resolveOptions'), {
  virtual: true,
});
jest.mock('../compileIosAsync.js', () => jest.requireActual('../compileIosAsync'), {
  virtual: true,
});

const appPath = '/DerivedData/Build/Products/Debug-iphonesimulator/ReactNativeProject.app';

const mockPlatform = (value: typeof process.platform) =>
  Object.defineProperty(process, 'platform', { value });

const platform = process.platform;

beforeEach(() => {
  mockPlatform('darwin');
  vol.fromJSON(rnFixture, '/app');
  jest.mocked(spawnAsync).mockImplementation(
    (_command, args) =>
      Promise.resolve({
        stdout: args?.includes('-showBuildSettings')
          ? JSON.stringify([
              {
                target: 'ReactNativeProject',
                buildSettings: {
                  TARGET_BUILD_DIR: '/DerivedData/Build/Products/Debug-iphonesimulator',
                  WRAPPER_NAME: 'ReactNativeProject.app',
                },
              },
            ])
          : '',
      }) as any
  );
});

afterEach(() => {
  mockPlatform(platform);
  vol.reset();
});

const output = () =>
  jest
    .mocked(Log.log)
    .mock.calls.map(([message]) => message)
    .join('');

it('documents itself without touching the project', async () => {
  await expoCompileIos(['--help']);

  expect(output()).toContain('  Usage\n    $ npx expo compile:ios <dir>');
  expect(output()).toContain('--output-type <app|ipa>');
  expect(loadEnvFiles).not.toHaveBeenCalled();
  expect(spawnAsync).not.toHaveBeenCalled();
  expect(Log.exit).not.toHaveBeenCalled();
});

it('builds the app for the simulator', async () => {
  await expoCompileIos(['/app', '--dev']);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(spawnAsync).toHaveBeenCalledWith(
    'xcodebuild',
    [
      '-project',
      '/app/ios/ReactNativeProject.xcodeproj',
      '-configuration',
      'Debug',
      '-scheme',
      'ReactNativeProject',
      '-destination',
      'generic/platform=iOS Simulator',
      'COCOAPODS_PARALLEL_CODE_SIGN=true',
      'COMPILER_INDEX_STORE_ENABLE=NO',
    ],
    { stdio: 'inherit', env: expect.objectContaining({ RCT_NO_LAUNCH_PACKAGER: 'true' }) }
  );
  expect(spawnAsync).toHaveBeenCalledWith('xattr', [
    '-r',
    '-d',
    'com.apple.FinderInfo',
    '/app/ios',
  ]);
  expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Build complete'));
  expect(Log.log).toHaveBeenCalledWith(expect.stringContaining(`Binary: ${appPath}`));
  const done = jest.mocked(event.span).mock.results[0]?.value;
  expect(done).toHaveBeenCalledWith('build:done', { platform: 'ios', mode: 'development' });
  expect(done).toHaveBeenCalledWith('done', {
    platform: 'ios',
    mode: 'development',
    outputType: 'app',
    outputPath: appPath,
  });
});

it('refuses production before loading env files', async () => {
  await expect(expoCompileIos(['/app'])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Production builds are not supported yet. Pass --dev to build in development mode.',
    })
  );
  expect(loadEnvFiles).not.toHaveBeenCalled();
  expect(spawnAsync).not.toHaveBeenCalled();
});

it('only runs on macOS', async () => {
  mockPlatform('win32');

  await expect(expoCompileIos(['/app', '--dev'])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(expect.stringMatching(/eas build -p ios/));
  expect(spawnAsync).not.toHaveBeenCalled();
});

it('reports a failed build', async () => {
  jest
    .mocked(spawnAsync)
    .mockImplementation(
      (command) =>
        (command === 'xcodebuild'
          ? Promise.reject(Object.assign(new Error(), { status: 65 }))
          : Promise.resolve({ stdout: '' })) as any
    );

  await expect(expoCompileIos(['/app', '--dev'])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Failed to build iOS project. "xcodebuild" exited with error code 65.',
    })
  );
  expect(event).toHaveBeenCalledWith('build:failed', {
    platform: 'ios',
    error: expect.objectContaining({ message: expect.stringContaining('error code 65') }),
  });
  expect(Log.log).not.toHaveBeenCalledWith(expect.stringContaining('Build complete'));
});
