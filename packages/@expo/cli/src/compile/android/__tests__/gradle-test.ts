import { vol } from 'memfs';

import { getApkPath, getGradleArgs } from '../gradle';

describe(getGradleArgs, () => {
  it.each([
    { variant: 'debug', task: 'app:assembleDebug' },
    { variant: 'release', task: 'app:assembleRelease' },
  ])(`returns the $task arguments`, ({ variant, task }) => {
    expect(getGradleArgs({ variant })).toEqual([
      task,
      '-x',
      'lint',
      '-x',
      'test',
      '--configure-on-demand',
      '--build-cache',
    ]);
  });
});

describe(getApkPath, () => {
  afterEach(() => vol.reset());

  it(`returns the built APK path`, () => {
    vol.fromJSON(
      {
        'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
          elements: [{ type: 'SINGLE', outputFile: 'app-debug.apk' }],
        }),
      },
      '/app'
    );

    expect(getApkPath('/app', { variant: 'debug' })).toBe(
      '/app/android/app/build/outputs/apk/debug/app-debug.apk'
    );
  });

  it(`returns the universal APK when the APK is split by architecture`, () => {
    vol.fromJSON(
      {
        'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
          elements: [
            { type: 'ONE_OF_MANY', outputFile: 'app-x86_64-debug.apk' },
            { type: 'UNIVERSAL', outputFile: 'app-universal-debug.apk' },
          ],
        }),
      },
      '/app'
    );

    expect(getApkPath('/app', { variant: 'debug' })).toBe(
      '/app/android/app/build/outputs/apk/debug/app-universal-debug.apk'
    );
  });

  it(`throws when the APK is split without a universal APK`, () => {
    vol.fromJSON(
      {
        'android/app/build/outputs/apk/debug/output-metadata.json': JSON.stringify({
          elements: [
            { type: 'ONE_OF_MANY', outputFile: 'app-x86_64-debug.apk' },
            { type: 'ONE_OF_MANY', outputFile: 'app-arm64-v8a-debug.apk' },
          ],
        }),
      },
      '/app'
    );

    expect(() => getApkPath('/app', { variant: 'debug' })).toThrow(
      'The build made several APKs in /app/android/app/build/outputs/apk/debug, and compile needs one APK that works on every device. If android/app/build.gradle splits APKs by architecture, add `universalApk true` to its `splits.abi` block.'
    );
  });

  it(`throws when the APK isn't found`, () => {
    vol.fromJSON({ 'android/app/build/outputs/apk/quest/debug/app-quest-debug.apk': '' }, '/app');

    expect(() => getApkPath('/app', { variant: 'debug' })).toThrow(
      'Could not find the built APK in /app/android/app/build/outputs/apk/debug.'
    );
  });

  it(`throws when the output metadata is malformed`, () => {
    vol.fromJSON(
      { 'android/app/build/outputs/apk/debug/output-metadata.json': 'not json' },
      '/app'
    );

    expect(() => getApkPath('/app', { variant: 'debug' })).toThrow(
      /Could not parse JSON in "\/app\/android\/app\/build\/outputs\/apk\/debug\/output-metadata\.json"\.\n\nnot json\n\nError: /
    );
  });
});
