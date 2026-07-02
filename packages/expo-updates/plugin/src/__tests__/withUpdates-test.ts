import { ExpoConfig } from 'expo/config';
import { AndroidConfig, IOSConfig } from 'expo/config-plugins';

import withUpdates from '../withUpdates';

jest.mock('expo/config');

jest.mock('expo/config-plugins', () => {
  const actual = jest.requireActual('expo/config-plugins');
  return {
    ...actual,
    AndroidConfig: {
      ...actual.AndroidConfig,
      Updates: {
        ...actual.AndroidConfig.Updates,
        withUpdates: jest.fn((config) => config),
      },
    },
    IOSConfig: {
      ...actual.IOSConfig,
      Updates: {
        ...actual.IOSConfig.Updates,
        withUpdates: jest.fn((config) => config),
      },
    },
  };
});

describe('Updates plugin', () => {
  beforeAll(() => {
    jest.mocked(AndroidConfig.Updates.withUpdates).mockReturnValue(getConfig());
    jest.mocked(IOSConfig.Updates.withUpdates).mockReturnValue(getConfig());
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
