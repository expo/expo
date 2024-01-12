import { getConfig, getProjectConfigDescriptionWithPaths, ProjectConfig } from '@expo/config';

import * as Log from '../../../../log';
import { stripAnsi } from '../../../../utils/ansi';
import {
  isWebPlatformExcluded,
  WebSupportProjectPrerequisite,
} from '../WebSupportProjectPrerequisite';

jest.mock('../../../../log');
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

async function expectThrowsErrorStrippedMessageMatching(fn: Function, test: RegExp) {
  let error;
  try {
    await fn();
  } catch (e) {
    error = e;
  }
  if (error === undefined) {
    throw new Error('did not throw');
  }
  expect(stripAnsi(error.message)).toMatch(test);
}

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

describe('assertAsync', () => {
  beforeEach(() => {
    delete process.env.EXPO_NO_WEB_SETUP;
  });
  afterAll(() => {
    delete process.env.EXPO_NO_WEB_SETUP;
  });
  it('skips setup due to environment variable', async () => {
    process.env.EXPO_NO_WEB_SETUP = '1';
    const prerequisite = new WebSupportProjectPrerequisite('/');
    await prerequisite.assertAsync();
    expect(Log.warn).toHaveBeenCalledWith(
      expect.stringMatching(/Skipping web setup: EXPO_NO_WEB_SETUP is enabled\./)
    );
  });
});

describe('_shouldSetupWebSupportAsync', () => {
  const projectRoot = '/test-project';

  it('skips setup due to platform exclusion', async () => {
    jest.mocked(getProjectConfigDescriptionWithPaths).mockReturnValueOnce('app.json');
    jest.mocked(getConfig).mockReturnValueOnce({
      pkg: {},
      rootConfig: {
        expo: {
          platforms: ['ios', 'android'],
        },
      },
    } as ProjectConfig);

    const prerequisite = new WebSupportProjectPrerequisite(projectRoot);
    await expectThrowsErrorStrippedMessageMatching(
      prerequisite._shouldSetupWebSupportAsync.bind(prerequisite),
      /Skipping web setup: "web" is not included in the project app\.json "platforms" array\./
    );
  });

  it('should setup web support', async () => {
    jest.mocked(getProjectConfigDescriptionWithPaths).mockReturnValueOnce('app.json');
    jest.mocked(getConfig).mockReturnValueOnce({
      pkg: {},
      rootConfig: {
        expo: {},
      },
    } as ProjectConfig);
    const prerequisite = new WebSupportProjectPrerequisite(projectRoot);
    await expect(prerequisite._shouldSetupWebSupportAsync()).resolves.toEqual(expect.anything());
  });
});
