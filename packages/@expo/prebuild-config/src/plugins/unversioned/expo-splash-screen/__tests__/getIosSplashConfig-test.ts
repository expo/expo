import { WarningAggregator } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

import { getIosSplashConfig, warnUnsupportedSplashProperties } from '../getIosSplashConfig';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
  };
});

describe(getIosSplashConfig, () => {
  it(`uses the more specific splash`, () => {
    const config = getIosSplashConfig({
      slug: '',
      name: '',
      splash: { backgroundColor: 'red', image: 'a' },
      ios: { splash: { image: 'b' } },
    });
    expect(config.image).toBe('b');
    // ensure the background color from the general splash config is not used if the ios splash config is defined.
    expect(config.backgroundColor).toBe('#ffffff');
    expect(config.resizeMode).toBe('contain');
  });
});

describe(warnUnsupportedSplashProperties, () => {
  it(`warns about currently unsupported properties`, () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningIOS.mockImplementationOnce();

    const config: ExpoConfig = {
      slug: '',
      name: '',
      //   userInterfaceStyle: 'light',
      ios: {
        splash: {
          xib: './somn',
          userInterfaceStyle: 'light',
          tabletImage: 'tabletImg',
          image: 'b',
        },
      },
    };

    warnUnsupportedSplashProperties(config);

    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'ios.splash.xib',
      'property is not supported in prebuild. Please use ios.splash.image instead.'
    );
  });
});
