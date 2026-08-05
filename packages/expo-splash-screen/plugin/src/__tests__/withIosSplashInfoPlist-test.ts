import { ExpoConfig } from 'expo/config';
import { WarningAggregator } from 'expo/config-plugins';

import { IOSSplashConfig } from '../types';
import { setSplashInfoPlist } from '../withIosSplashInfoPlist';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
  };
});

const baseConfig: ExpoConfig = {
  slug: '',
  name: '',
  userInterfaceStyle: 'light',
};

const baseSplash: IOSSplashConfig = {
  backgroundColor: '#ffffff',
  enableFullScreenImage_legacy: false,
  imageWidth: 100,
  resizeMode: 'contain',
};

describe(setSplashInfoPlist, () => {
  it(`skips warning if dark mode isn't defined`, () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningIOS.mockImplementationOnce();

    const infoPlist = setSplashInfoPlist(
      baseConfig,
      {},
      {
        ...baseSplash,
        image: 'b',
      }
    );

    // Check if the warning was thrown
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(0);

    // Ensure these values are set
    expect(infoPlist.UIUserInterfaceStyle).not.toBeDefined();
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');
  });
  it(`warns about dark mode conflicts and resets the interface style`, () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningIOS.mockImplementationOnce();

    const infoPlist = setSplashInfoPlist(
      baseConfig,
      {},
      {
        ...baseSplash,
        image: 'b',
        dark: { image: 'v' },
      }
    );

    // Check if the warning was thrown
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'userInterfaceStyle',
      'The existing `userInterfaceStyle` property is preventing splash screen from working properly. Remove it or disable dark mode splash screens.'
    );

    // Ensure these values are set
    expect(infoPlist.UIUserInterfaceStyle).toBe('Automatic');
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');
  });
});
