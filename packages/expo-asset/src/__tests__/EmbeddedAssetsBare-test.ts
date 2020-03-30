import * as Updates from 'expo-updates';

import * as EmbeddedAssets from '../EmbeddedAssets';

jest.mock('expo-updates', () => ({
  localAssets: {
    hasOwnProperty: jest.fn(),
  },
}));

jest.mock('../PlatformUtils', () => ({
  IS_MANAGED_ENV: false,
  IS_BARE_ENV_WITH_UPDATES: false,
  IS_BARE_ENV_WITHOUT_UPDATES: true,
}));

describe('getEmbeddedAssetUri', () => {
  describe('bare app without updates', () => {
    beforeAll(() => {
      // @ts-ignore: the type declaration marks __DEV__ as read-only
      __DEV__ = false;
    });

    afterAll(() => {
      // @ts-ignore: the type declaration marks __DEV__ as read-only
      __DEV__ = true;
    });

    it(`bails out early and returns null`, () => {
      const localAssets = Updates.localAssets;
      const uri = EmbeddedAssets.getEmbeddedAssetUri('anything', 'here');
      expect(uri).toBe(null);
      expect(localAssets.hasOwnProperty).toHaveBeenCalledTimes(0);
    });
  });
});
