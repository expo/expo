import { getAccountUsername } from '@expo/config';
import { ExpoConfig } from '@expo/config-types';

import withUpdates from '../withUpdates';
import { withUpdatesAndroid } from '../withUpdatesAndroid';
import { withUpdatesIOS } from '../withUpdatesIOS';

jest.mock('../withUpdatesAndroid');
jest.mock('../withUpdatesIOS');
jest.mock('@expo/config');

describe('Updates plugin', () => {
  it('passes in expo username, resolved by getAccountUsername', () => {
    const expoUsername = 'some-username';
    // @ts-ignore: return the username so we can validate it is passed to the ios/android plugins
    getAccountUsername.mockReturnValue(expoUsername);

    withUpdates(getConfig());

    // @ts-ignore: this is an expect extension and is not defined on the type
    const _ = expect.literallyAnything();
    expect(withUpdatesAndroid).toHaveBeenCalledWith(_, { expoUsername });
    expect(withUpdatesIOS).toHaveBeenCalledWith(_, { expoUsername });
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
