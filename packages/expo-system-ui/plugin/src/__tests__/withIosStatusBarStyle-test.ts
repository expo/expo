import { withInfoPlist } from 'expo/config-plugins';

import { compileMockModWithResultsAsync } from './mockMods';
import { withIosStatusBarStyle } from '../withIosStatusBarStyle';

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    withInfoPlist: jest.fn(),
  };
});

describe(withIosStatusBarStyle, () => {
  it(`updates UIStatusBarStyle property when userInterfaceStyle is set`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      {
        experiments: { edgeToEdge: true },
        userInterfaceStyle: 'light',
      },
      {
        plugin: withIosStatusBarStyle,
        mod: withInfoPlist,
        modResults: { UIStatusBarStyle: 'UIStatusBarStyleDefault' },
      }
    );

    expect(modResults).toStrictEqual({ UIStatusBarStyle: 'UIStatusBarStyleDarkContent' });
  });

  it(`doesn't update UIStatusBarStyle property when edge to edge is disabled`, async () => {
    const { modResults } = await compileMockModWithResultsAsync(
      {
        experiments: { edgeToEdge: false },
        userInterfaceStyle: 'dark',
      },
      {
        plugin: withIosStatusBarStyle,
        mod: withInfoPlist,
        modResults: { UIStatusBarStyle: 'UIStatusBarStyleDefault' },
      }
    );

    expect(modResults).toStrictEqual({ UIStatusBarStyle: 'UIStatusBarStyleDefault' });
  });
});
