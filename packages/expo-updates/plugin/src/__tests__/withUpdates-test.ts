import { getAccountUsername } from '@expo/config';
import { AndroidConfig, IOSConfig } from '@expo/config-plugins';
import { ExpoConfig } from '@expo/config-types';

import withUpdates from '../withUpdates';

jest.mock('@expo/config');

describe('Updates plugin', () => {
  it('passes in expo username, resolved by getAccountUsername', () => {
    jest.spyOn(AndroidConfig.Updates, 'withUpdates');
    jest.spyOn(IOSConfig.Updates, 'withUpdates');

    const expoUsername = 'some-username';
    // @ts-ignore: return the username so we can validate it is passed to the ios/android plugins
    getAccountUsername.mockReturnValue(expoUsername);

    withUpdates(getConfig());

    // @ts-ignore: this is an expect extension and is not defined on the type
    const _ = expect.literallyAnything();
    expect(AndroidConfig.Updates.withUpdates).toHaveBeenCalledWith(_, { expoUsername });
    expect(IOSConfig.Updates.withUpdates).toHaveBeenCalledWith(_, { expoUsername });
  });

  it('passes the config object to getAccountUsername', () => {
    withUpdates(getConfig({ owner: 'real-owner' }));
    expect(getAccountUsername).toHaveBeenCalledWith(
      expect.objectContaining({ owner: 'real-owner' })
    );
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
