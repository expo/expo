import { WarningAggregator } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

import { setSplashInfoPlist } from '../withIosSplashInfoPlist';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
  };
});

describe(setSplashInfoPlist, () => {
  it(`skips warning if dark mode isn't defined`, () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningIOS.mockImplementationOnce();
    const config: ExpoConfig = {
      slug: '',
      name: '',
      userInterfaceStyle: 'light',
      ios: { splash: { image: 'b' } },
    };
    const infoPlist = setSplashInfoPlist(config, {}, {
      userInterfaceStyle: 'light',
      image: 'b',
    } as any);

    // Check if the warning was thrown
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(0);

    // Ensure these values are set
    expect(infoPlist.UIUserInterfaceStyle).not.toBeDefined();
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');
  });
  it(`warns about dark mode conflicts and resets the interface style`, () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningIOS.mockImplementationOnce();

    const config: ExpoConfig = {
      slug: '',
      name: '',
      userInterfaceStyle: 'light',

      ios: { splash: { image: 'b', dark: { image: 'v' } } },
    };

    const infoPlist = setSplashInfoPlist(config, {}, {
      userInterfaceStyle: 'light',
      image: 'b',
      dark: { image: 'v' },
    } as any);

    // Check if the warning was thrown
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'userInterfaceStyle',
      'The existing `userInterfaceStyle` property is preventing splash screen from working properly. Please remove it or disable dark mode splash screens.'
    );

    // Ensure these values are set
    expect(infoPlist.UIUserInterfaceStyle).toBe('Automatic');
    expect(infoPlist.UILaunchStoryboardName).toBe('SplashScreen');
  });
});
