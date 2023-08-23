import { ExpoConfig } from 'expo/config';
import { AndroidConfig, IOSConfig } from 'expo/config-plugins';

import withUpdates from '../withUpdates';

jest.mock('@expo/config');

describe('Updates plugin', () => {
  beforeAll(() => {
    const config = getConfig();
    jest.spyOn(AndroidConfig.Updates, 'withUpdates').mockReturnValue(config);
    jest.spyOn(IOSConfig.Updates, 'withUpdates').mockReturnValue(config);
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  it('calls platforms', () => {
    withUpdates(getConfig());

    // @ts-ignore: this is an expect extension and is not defined on the type
    const _ = expect.literallyAnything();
    expect(AndroidConfig.Updates.withUpdates).toHaveBeenCalledWith(_);
    expect(IOSConfig.Updates.withUpdates).toHaveBeenCalledWith(_);
  });
});

function getConfig(options = {}): ExpoConfig {
  return {
    name: 'foo',
    slug: 'my-app',
    ...options,
  };
}

// expect.anything() doesn't match for undefined | null
expect.extend({
  literallyAnything: () => {
    return {
      message: () => 'This value is ignored',
      pass: true,
    };
  },
});
