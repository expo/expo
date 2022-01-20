import { vol } from 'memfs';
import path from 'path';
import stripAnsi from 'strip-ansi';

import {
  createInstallCommand,
  isWebPlatformExcluded,
  shouldSetupWebSupportAsync,
} from '../ensureWebSetup';

jest.mock('fs');

describe(isWebPlatformExcluded, () => {
  it('should return true if the platform is excluded', () => {
    expect(isWebPlatformExcluded({ expo: { name: '', slug: '', platforms: ['android'] } })).toBe(
      true
    );
  });
  it('should return false if the platforms array is empty', () => {
    expect(isWebPlatformExcluded({ expo: { name: '', slug: '', platforms: [] } })).toBe(false);
  });
  it('should return false if the platform is included', () => {
    expect(
      isWebPlatformExcluded({ expo: { name: '', slug: '', platforms: ['android', 'web'] } })
    ).toBe(false);
  });
  it(`should return false if the platforms array isn't defined`, () => {
    expect(isWebPlatformExcluded({ expo: { name: '', slug: '' } })).toBe(false);
  });
});

describe(createInstallCommand, () => {
  it(`formats yarn`, () => {
    expect(
      createInstallCommand({
        isYarn: true,
        packages: [
          { pkg: 'bacon', file: '', version: '~1.0.0' },
          { pkg: 'other', file: '' },
        ],
      })
    ).toBe('yarn add bacon@~1.0.0 other');
  });
  it(`formats npm`, () => {
    expect(
      createInstallCommand({
        isYarn: false,
        packages: [
          { pkg: '@other/pkg', file: '' },
          { pkg: 'bacon', file: '', version: '~1.0.0' },
        ],
      })
    ).toBe('npm install @other/pkg bacon@~1.0.0');
  });
});

describe(shouldSetupWebSupportAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    vol.reset();
    delete process.env.EXPO_NO_WEB_SETUP;
  });

  it('skips setup due to platform exclusion', async () => {
    vol.fromJSON({
      [path.join(projectRoot, 'app.json')]: JSON.stringify({
        expo: { platforms: ['ios', 'android'] },
      }),
      [path.join(projectRoot, 'package.json')]: JSON.stringify({
        name: 'my-app',
      }),
    });

    // @ts-expect-error
    expect(stripAnsi((await shouldSetupWebSupportAsync(projectRoot)).failureReason)).toBe(
      '› Skipping web setup: "web" is not included in the project app.json "platforms" array.'
    );
  });
  it('skips setup due to environment variable', async () => {
    vol.fromJSON({
      [path.join(projectRoot, 'app.json')]: JSON.stringify({
        expo: {},
      }),
      [path.join(projectRoot, 'package.json')]: JSON.stringify({
        name: 'my-app',
      }),
    });
    process.env.EXPO_NO_WEB_SETUP = '1';

    // @ts-expect-error
    expect(stripAnsi((await shouldSetupWebSupportAsync(projectRoot)).failureReason)).toBe(
      '› Skipping web setup: EXPO_NO_WEB_SETUP is enabled.'
    );
  });
  it('should setup web support', async () => {
    vol.fromJSON({
      [path.join(projectRoot, 'app.json')]: JSON.stringify({
        expo: {},
      }),
      [path.join(projectRoot, 'package.json')]: JSON.stringify({
        name: 'my-app',
      }),
    });

    expect(
      // @ts-expect-error
      stripAnsi((await shouldSetupWebSupportAsync(projectRoot)).failureReason)
    ).toBeUndefined();
  });
});
