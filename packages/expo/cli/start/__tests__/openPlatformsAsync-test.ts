import { openPlatformsAsync } from '../openPlatformsAsync';

import * as Android from '../android/Android';
import * as Apple from '../ios/Apple';
import * as Webpack from '../webpack/Webpack';

jest.mock('../android/Android', () => {
  return {
    openProjectAsync: jest.fn(() =>
      Promise.resolve({
        success: true,
        url: 'exp://localhost:19000',
      })
    ),
    openWebProjectAsync: jest.fn(),
  };
});
jest.mock('../ios/Apple', () => {
  return {
    openProjectAsync: jest.fn(() =>
      Promise.resolve({
        success: true,
        url: 'exp://localhost:19000',
        udid: '123',
        bundleIdentifier: 'host.exp.Exponent',
      })
    ),
    openWebProjectAsync: jest.fn(),
  };
});
jest.mock('../webpack/Webpack', () => {
  return {
    openAsync: jest.fn(),
  };
});

const asMock = (fn: any): jest.Mock => fn as jest.Mock;

describe(openPlatformsAsync, () => {
  beforeEach(() => {
    asMock(Android.openProjectAsync).mockReset();
    asMock(Android.openWebProjectAsync).mockReset();
    asMock(Apple.openProjectAsync).mockReset();
    asMock(Apple.openWebProjectAsync).mockReset();
    asMock(Webpack.openAsync).mockReset();
  });
  it(`opens all platforms natively`, async () => {
    await expect(
      openPlatformsAsync(
        './',
        {
          android: true,
          ios: true,
          web: true,
          devClient: false,
        },
        {
          webOnly: false,
        }
      )
    ).toBe(true);
    expect(Android.openProjectAsync).toBeCalledTimes(1);
  });
});
