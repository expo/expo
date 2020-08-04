import { hashCode } from '../Updates';

const TEST_BUNDLE_URL =
  'https://d1wp6m56sqw74a.cloudfront.net/%40charliecruzan%2Fnew-slug%2F3.0.1%2F6edcb41485604de0ae3efaf75ab59c44-37.0.0-android.js';

function mockFileSystem() {
  jest.doMock('expo-file-system', () => {
    const FileSystem = jest.requireActual('expo-file-system');
    return {
      ...FileSystem,
      documentDirectory: () => {
        return '/data/user/0/com.package/files/37.0.0/';
      },
      readDirectoryAsync: () => {
        return [
          'cached-bundle-experience-%40username%2Fslug1111111111-37.0.0',
          'cached-bundle-experience-%40username%2Fslug2222222222-37.0.0',
          'cached-bundle-experience-%40username%2Fslug3333333333-37.0.0',
        ];
      },
    };
  });
}

function mockConstantsBundleUrl() {
  jest.doMock('expo-constants', () => {
    const Constants = jest.requireActual('expo-constants').default;
    return {
      ...Constants,
      manifest: { bundleUrl: TEST_BUNDLE_URL },
    };
  });
}

describe('Updates', () => {
  describe('clearUpdateCacheExperimentalAsync', () => {
    afterEach(() => {
      jest.resetModules();
    });

    it('hashCode function result matches result from java String.hashcode', () => {
      expect(hashCode(TEST_BUNDLE_URL)).toMatch('1777197169');
    });

    it('returns false when no manifest', async () => {
      const { clearUpdateCacheExperimentalAsync } = require('../Updates');
      expect(await clearUpdateCacheExperimentalAsync()).toStrictEqual({
        success: false,
        errors: ['This method is only available in standalone apps.'],
      });
    });

    it('returns true when mocking documentDirectory, bundleUrl, and readDirectoryAsync result', async () => {
      mockFileSystem();
      mockConstantsBundleUrl();
      const { clearUpdateCacheExperimentalAsync } = require('../Updates');
      expect(await clearUpdateCacheExperimentalAsync()).toStrictEqual({
        success: true,
        errors: [],
      });
    });
  });
});
