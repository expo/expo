import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { platformSanityCheckAsync } from '../generateNativeProjects';

jest.mock('@expo/spawn-async');
jest.mock('fs');
jest.mock('fs/promises');
const mockedSpawnAsync = spawnAsync as jest.MockedFunction<typeof spawnAsync>;

describe(platformSanityCheckAsync, () => {
  beforeEach(() => {
    mockedSpawnAsync.mockClear();
    vol.reset();
    vol.mkdirpSync('/app/ios');
    vol.writeFileSync('/app/ios/Podfile', '');
    vol.mkdirpSync('/app/android');
    vol.writeFileSync('/app/android/build.gradle', '');
  });

  it('should resolve promise if everything looks good', async () => {
    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
          android: {
            package: 'com.testproject',
          },
        },
        platform: 'android',
      })
    ).resolves.toBeUndefined();

    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
          ios: {
            bundleIdentifier: 'com.testproject',
          },
        },
        platform: 'ios',
      })
    ).resolves.toBeUndefined();
  });

  it('should throw an error if git is not installed', async () => {
    const error = new Error('spawn git ENOENT');
    // @ts-expect-error: Simulate spawn error
    error.code = 'ENOENT';
    mockedSpawnAsync.mockRejectedValue(error);
    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
          android: {
            package: 'com.testproject',
          },
        },
        platform: 'android',
      })
    ).rejects.toThrowError(/Git is required to run this command/);
  });

  it('should throw an error if missing config', async () => {
    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        // @ts-expect-error
        exp: {},
        platform: 'ios',
      })
    ).rejects.toThrow();

    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
        },
        platform: 'android',
      })
    ).rejects.toThrowError(/android\.package is not defined/);

    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
        },
        platform: 'ios',
      })
    ).rejects.toThrowError(/ios\.bundleIdentifier is not defined/);
  });

  it('should throw an error if platform directory does not exist', async () => {
    vol.rmSync('/app/android', { recursive: true, force: true });
    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
          android: {
            package: 'com.testproject',
          },
        },
        platform: 'android',
      })
    ).rejects.toThrowError(/Platform directory does not exist/);

    vol.rmSync('/app/ios', { recursive: true, force: true });
    await expect(
      platformSanityCheckAsync({
        projectRoot: '/app',
        exp: {
          name: 'testproject',
          slug: 'testproject',
          ios: {
            bundleIdentifier: 'com.testproject',
          },
        },
        platform: 'ios',
      })
    ).rejects.toThrowError(/Platform directory does not exist/);
  });
});
