import { vol } from 'memfs';

import configureInfoPlist from '../Info.plist';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');

describe('Info.plist', () => {
  describe('configureInfoPlist', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    const iosProjectPath = `/app/ios/ReactNativeProject`;
    const filePath = `${iosProjectPath}/Info.plist`;

    it('updates the file correctly', async () => {
      await configureInfoPlist(iosProjectPath);
      const actual = vol.readFileSync(filePath, 'utf-8');
      expect(actual).toMatch(
        /<key>UILaunchStoryboardName<\/key>(\n|.)*<string>SplashScreen<\/string>/
      );
    });
  });
});
