import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { Log } from '../../../log';
import rnFixture from '../../../prebuild/__tests__/fixtures/react-native-project';
import { copyAsync, removeAsync } from '../../../utils/dir';
import { loadEnvFiles } from '../../../utils/nodeEnv.js';
import { event } from '../../events';
import { expoCompileAndroid } from '../index';

jest.mock('../../../log');
jest.mock('../../../utils/dir');
jest.mock('../../../utils/nodeEnv.js', () => ({ loadEnvFiles: jest.fn() }), { virtual: true });
jest.mock('../../events', () => {
  const done = jest.fn();
  return {
    event: Object.assign(jest.fn(), {
      span: jest.fn(() => done),
      error: jest.fn((error) => error),
      path: jest.fn((path) => path),
    }),
    debugEvent: jest.fn(),
  };
});
jest.mock('../../resolveMode.js', () => jest.requireActual('../../resolveMode'), {
  virtual: true,
});
jest.mock('../../resolveOptions.js', () => jest.requireActual('../../resolveOptions'), {
  virtual: true,
});
jest.mock('../compileAndroidAsync.js', () => jest.requireActual('../compileAndroidAsync'), {
  virtual: true,
});

const apkPath = '/app/android/app/build/outputs/apk/debug/app-debug.apk';

beforeEach(() => {
  vol.fromJSON(
    {
      ...rnFixture,
      'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
        elements: [{ type: 'SINGLE', outputFile: 'app-debug.apk' }],
      }),
    },
    '/app'
  );
});

afterEach(() => {
  vol.reset();
});

const output = () =>
  jest
    .mocked(Log.log)
    .mock.calls.map(([message]) => message)
    .join('');

it('documents itself without touching the project', async () => {
  await expoCompileAndroid(['--help']);

  expect(output()).toContain('  Usage\n    $ npx expo compile:android <dir>');
  expect(output()).toContain('--output-type <apk|aab>');
  expect(loadEnvFiles).not.toHaveBeenCalled();
  expect(spawnAsync).not.toHaveBeenCalled();
  expect(Log.exit).not.toHaveBeenCalled();
});

it('builds the app for every architecture', async () => {
  await expoCompileAndroid(['/app', '--dev']);

  expect(loadEnvFiles).toHaveBeenCalledWith('/app', { mode: 'development' });
  expect(spawnAsync).toHaveBeenCalledWith(
    '/app/android/gradlew',
    ['app:assembleDebug', '-x', 'lint', '-x', 'test', '--configure-on-demand', '--build-cache'],
    { cwd: '/app/android', stdio: 'inherit' }
  );
  expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Build complete'));
  expect(Log.log).toHaveBeenCalledWith(expect.stringContaining(`Binary: ${apkPath}`));
  const done = jest.mocked(event.span).mock.results[0]?.value;
  expect(done).toHaveBeenCalledWith('build:done', { platform: 'android', mode: 'development' });
  expect(done).toHaveBeenCalledWith('done', {
    platform: 'android',
    mode: 'development',
    outputType: 'apk',
    outputPath: apkPath,
  });
});

it('copies the app to the output directory', async () => {
  await expoCompileAndroid(['/app', '--dev', '--output-dir', 'build']);

  expect(removeAsync).toHaveBeenCalledWith('/app/build/app-debug.apk');
  expect(copyAsync).toHaveBeenCalledWith(apkPath, '/app/build/app-debug.apk');
  expect(Log.log).toHaveBeenCalledWith(expect.stringContaining('Binary: /app/build/app-debug.apk'));
});

it('refuses production before loading env files', async () => {
  await expect(expoCompileAndroid(['/app'])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Production builds are not supported yet. Pass --dev to build in development mode.',
    })
  );
  expect(loadEnvFiles).not.toHaveBeenCalled();
  expect(spawnAsync).not.toHaveBeenCalled();
});

it('reports a failed build', async () => {
  jest.mocked(spawnAsync).mockRejectedValueOnce(Object.assign(new Error(), { status: 1 }));

  await expect(expoCompileAndroid(['/app', '--dev'])).rejects.toThrow(/EXIT_CALLED/);

  expect(Log.exit).toHaveBeenCalledWith(
    expect.objectContaining({
      message: 'Failed to build Android project. "gradlew" exited with error code 1.',
    })
  );
  expect(event).toHaveBeenCalledWith('build:failed', {
    platform: 'android',
    error: expect.objectContaining({ message: expect.stringContaining('error code 1') }),
  });
  expect(Log.log).not.toHaveBeenCalledWith(expect.stringContaining('Build complete'));
});
