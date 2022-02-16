import { getConfig, getProjectConfigDescriptionWithPaths } from '@expo/config';

import { stripAnsi } from '../../../../utils/ansi';
import { isWebPlatformExcluded, shouldSetupWebSupportAsync } from '../ensureWebSetup';

const asMock = (fn: any): jest.Mock => fn;

jest.mock('@expo/config', () => ({
  getProjectConfigDescriptionWithPaths: jest.fn(),
  getConfig: jest.fn(() => ({
    pkg: {},
    exp: {
      sdkVersion: '45.0.0',
      name: 'my-app',
      slug: 'my-app',
    },
  })),
}));

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

describe(shouldSetupWebSupportAsync, () => {
  const projectRoot = '/test-project';

  beforeEach(() => {
    delete process.env.EXPO_NO_WEB_SETUP;
  });

  it('skips setup due to platform exclusion', async () => {
    asMock(getProjectConfigDescriptionWithPaths).mockReturnValueOnce('app.json');
    asMock(getConfig).mockReturnValueOnce({
      pkg: {},
      rootConfig: {
        expo: {
          platforms: ['ios', 'android'],
        },
      },
    });

    // @ts-expect-error
    expect(stripAnsi((await shouldSetupWebSupportAsync(projectRoot)).failureReason)).toBe(
      '› Skipping web setup: "web" is not included in the project app.json "platforms" array.'
    );
  });
  it('skips setup due to environment variable', async () => {
    process.env.EXPO_NO_WEB_SETUP = '1';

    // @ts-expect-error
    expect(stripAnsi((await shouldSetupWebSupportAsync(projectRoot)).failureReason)).toBe(
      '› Skipping web setup: EXPO_NO_WEB_SETUP is enabled.'
    );
  });
  it('should setup web support', async () => {
    asMock(getProjectConfigDescriptionWithPaths).mockReturnValueOnce('app.json');
    asMock(getConfig).mockReturnValueOnce({
      pkg: {},
      rootConfig: {
        expo: {},
      },
    });

    expect(
      // @ts-expect-error
      stripAnsi((await shouldSetupWebSupportAsync(projectRoot)).failureReason)
    ).toBeUndefined();
  });
});
