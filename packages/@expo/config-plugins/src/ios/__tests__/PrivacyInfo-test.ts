import { ExpoConfig } from '@expo/config-types';
import { vol } from 'memfs';
import path from 'path';
import plist from '@expo/plist';

import { setPrivacyInfo, mergePrivacyInfo, PrivacyInfo } from '../PrivacyInfo';
import type { ExportedConfigWithProps } from '../..';
import type { XcodeProject } from 'xcode';

jest.mock('fs');

jest.mock('../utils/Xcodeproj',() => ({
    getProjectName: () => "testproject",
    addBuildSourceFileToGroup: jest.fn(),
}));


const originalFs = jest.requireActual('fs');

describe('withPrivacyInfo', () => {
  const projectRoot = '/testproject';

  afterEach(() => vol.reset());
  it('adds PrivacyInfo.xcprivacy file to the project and merges with existing file', async () => {
    const filePath  = 'ios/testproject/PrivacyInfo.xcprivacy';
    // mock the data in the PrivacyInfo.xcprivacy file using vol
    vol.fromJSON({
      'ios/testproject/PrivacyInfo.xcprivacy': originalFs.readFileSync(
        path.join(__dirname, 'fixtures/PrivacyInfo.xcprivacy'),
        'utf-8'
      ),
    }, projectRoot);

    const mockConfig: ExportedConfigWithProps<XcodeProject> = {
      //fill in relevant data here
      modResults: {
        hasFile: () => false,
      },
        modRequest: {
            projectRoot,
            platformProjectRoot: path.join(projectRoot, 'ios'),
            modName: 'test',
            platform: 'ios',
            introspect: false
        },
        modRawConfig: {
            name: 'test',
            slug: 'test',
        },
        name: 'test',
        slug: 'test',
    };
    const privacyManifests: PrivacyInfo = {
        NSPrivacyAccessedAPITypes: [
            {
                NSPrivacyAccessedAPIType: 'NSPrivacyAccessedAPICategoryTestCategory',
                NSPrivacyAccessedAPITypeReasons: ['TEST.TEST'],
            },
        ],
        NSPrivacyCollectedDataTypes: [],
        NSPrivacyTracking: true,
        NSPrivacyTrackingDomains: ["test.com"]
    };
    setPrivacyInfo(mockConfig, privacyManifests);
    expect(vol.readFileSync(path.join(projectRoot, filePath), 'utf-8')).toMatchSnapshot();
  });
});
