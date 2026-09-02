import { adbNotRunnableError, resolveAdb } from '../adb';

/** A filesystem that only knows the paths it was handed. */
function existsIn(paths: string[]) {
  return (candidate: string) => paths.includes(candidate);
}

describe(resolveAdb, () => {
  it('prefers ANDROID_HOME when it holds platform-tools/adb', () => {
    const resolution = resolveAdb({
      env: { ANDROID_HOME: '/sdk-home', ANDROID_SDK_ROOT: '/sdk-root' },
      platform: 'darwin',
      homedir: '/Users/ada',
      exists: existsIn(['/sdk-home/platform-tools/adb', '/sdk-root/platform-tools/adb']),
    });

    expect(resolution).toMatchObject({
      bin: '/sdk-home/platform-tools/adb',
      source: 'ANDROID_HOME',
      fromPathOnly: false,
    });
  });

  it('falls through to ANDROID_SDK_ROOT when ANDROID_HOME has no adb in it', () => {
    const resolution = resolveAdb({
      env: { ANDROID_HOME: '/sdk-home', ANDROID_SDK_ROOT: '/sdk-root' },
      platform: 'darwin',
      homedir: '/Users/ada',
      exists: existsIn(['/sdk-root/platform-tools/adb']),
    });

    expect(resolution.bin).toBe('/sdk-root/platform-tools/adb');
    expect(resolution.source).toBe('ANDROID_SDK_ROOT');
    // The env var that named a directory with no adb in it is worth reporting: it is the most
    // likely thing to be wrong on a machine where this fails.
    expect(resolution.searched).toContain('/sdk-home/platform-tools/adb');
  });

  it("prefers an adb somebody put on PATH over this module's guess at the SDK location", () => {
    const resolution = resolveAdb({
      env: { PATH: '/opt/bin:/usr/local/bin' },
      platform: 'darwin',
      homedir: '/Users/ada',
      exists: existsIn(['/usr/local/bin/adb', '/Users/ada/Library/Android/sdk/platform-tools/adb']),
    });

    // Both exist. A `PATH` entry is somebody choosing a copy; the default location is a guess.
    expect(resolution).toMatchObject({
      bin: '/usr/local/bin/adb',
      source: 'PATH',
      fromPathOnly: false,
    });
  });

  it('still prefers ANDROID_HOME over PATH, because naming it is more deliberate still', () => {
    expect(
      resolveAdb({
        env: { ANDROID_HOME: '/sdk', PATH: '/usr/local/bin' },
        platform: 'darwin',
        homedir: '/Users/ada',
        exists: existsIn(['/sdk/platform-tools/adb', '/usr/local/bin/adb']),
      }).bin
    ).toBe('/sdk/platform-tools/adb');
  });

  it('finds the default macOS SDK location when no environment variable names one', () => {
    const resolution = resolveAdb({
      env: {},
      platform: 'darwin',
      homedir: '/Users/ada',
      exists: existsIn(['/Users/ada/Library/Android/sdk/platform-tools/adb']),
    });

    expect(resolution).toMatchObject({
      bin: '/Users/ada/Library/Android/sdk/platform-tools/adb',
      source: 'default-sdk-location',
      fromPathOnly: false,
    });
  });

  it('finds either capitalisation of the default Linux SDK location', () => {
    expect(
      resolveAdb({
        env: {},
        platform: 'linux',
        homedir: '/home/ada',
        exists: existsIn(['/home/ada/Android/sdk/platform-tools/adb']),
      }).bin
    ).toBe('/home/ada/Android/sdk/platform-tools/adb');
  });

  it('names the Windows executable', () => {
    expect(
      resolveAdb({
        env: {},
        platform: 'win32',
        homedir: 'C:\\Users\\ada',
        exists: (candidate) => candidate.endsWith('adb.exe'),
      }).bin
    ).toContain('adb.exe');
  });

  it('falls back to the bare name, which only PATH can supply', () => {
    const resolution = resolveAdb({
      env: {},
      platform: 'darwin',
      homedir: '/Users/ada',
      exists: () => false,
    });

    expect(resolution).toMatchObject({ bin: 'adb', source: 'PATH', fromPathOnly: true });
    expect(resolution.searched).toEqual(['/Users/ada/Library/Android/sdk/platform-tools/adb']);
  });
});

describe(adbNotRunnableError, () => {
  it('names every place that was looked, and the variable that would fix it', () => {
    const error = adbNotRunnableError(
      resolveAdb({ env: {}, platform: 'darwin', homedir: '/Users/ada', exists: () => false }),
      'spawn adb ENOENT'
    );

    expect(error.code).toBe('ADB_NOT_RUNNABLE');
    // The headline must be about adb, never about a device: nothing looked for one.
    expect(error.message).toContain('"adb" could not be run');
    expect(error.message).not.toMatch(/no (android )?device/i);
    expect(error.message).toContain('/Users/ada/Library/Android/sdk/platform-tools/adb');
    expect(error.message).toContain('ANDROID_HOME');
  });

  it('says that the SDK copy it found is the one that failed', () => {
    const error = adbNotRunnableError(
      resolveAdb({
        env: { ANDROID_HOME: '/sdk' },
        platform: 'darwin',
        homedir: '/Users/ada',
        exists: existsIn(['/sdk/platform-tools/adb']),
      }),
      'EACCES'
    );

    expect(error.message).toContain('/sdk/platform-tools/adb');
    expect(error.message).toContain('ANDROID_HOME');
  });
});
