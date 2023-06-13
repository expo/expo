import assert from 'assert';

import { getIosSplashConfig } from '../getIosSplashConfig';

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
    assert(config);
    expect(config.image).toBe('b');
    // ensure the background color from the general splash config is not used if the ios splash config is defined.
    expect(config.backgroundColor).toBe('#ffffff');
    expect(config.resizeMode).toBe('contain');
  });
});
