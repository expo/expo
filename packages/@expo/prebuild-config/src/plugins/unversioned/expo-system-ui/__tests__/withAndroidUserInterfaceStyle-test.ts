import { WarningAggregator, withStringsXml } from '@expo/config-plugins';

import { withAndroidUserInterfaceStyle } from '../withAndroidUserInterfaceStyle';
import { compileMockModWithResultsAsync } from './mockMods';

jest.mock('@expo/config-plugins', () => {
  const plugins = jest.requireActual('@expo/config-plugins');
  return {
    ...plugins,
    withStringsXml: jest.fn(),
    WarningAggregator: { addWarningAndroid: jest.fn() },
  };
});

// jest.mock('@expo/config-plugins');

describe(withAndroidUserInterfaceStyle, () => {
  it(`does not warn when the key isn't defined`, async () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningAndroid.mockImplementationOnce();

    const { modResults } = await compileMockModWithResultsAsync(
      {},
      {
        plugin: withAndroidUserInterfaceStyle,
        mod: withStringsXml,
        modResults: { resources: {} },
      }
    );

    // Check if the warning was thrown
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(0);

    // Unchanged
    expect(modResults).toStrictEqual({ resources: {} });
  });

  it(`warns about unsupported feature`, async () => {
    // @ts-ignore: jest
    WarningAggregator.addWarningAndroid.mockImplementationOnce();

    const { modResults } = await compileMockModWithResultsAsync(
      { userInterfaceStyle: 'dark' },
      {
        plugin: withAndroidUserInterfaceStyle,
        mod: withStringsXml,
        modResults: { resources: {} },
      }
    );

    // Check if the warning was thrown
    expect(WarningAggregator.addWarningAndroid).toHaveBeenCalledTimes(1);

    // Unchanged
    expect(modResults).toStrictEqual({ resources: {} });
  });
});
