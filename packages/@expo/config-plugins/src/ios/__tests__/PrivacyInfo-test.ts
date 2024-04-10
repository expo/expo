import { ExpoConfig } from '@expo/config-types';
import { vol } from 'memfs';
import path from 'path';
import plist from '@expo/plist';

import { setPrivacyInfo, mergePrivacyInfo, PrivacyInfo } from '../PrivacyInfo';
import type { ExportedConfigWithProps } from '../..';
import type { XcodeProject } from 'xcode';

jest.mock('fs');

jest.mock('../utils/Xcodeproj', () => ({
  getProjectName: () => 'testproject',
  addBuildSourceFileToGroup: jest.fn(),
}));

const projectRoot = '/testproject';

const project = {
  name: 'test',
  slug: 'test',
};

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
    introspect: false,
  },
  modRawConfig: project,
  ...project,
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
  NSPrivacyTrackingDomains: ['test.com'],
};

const filePath = 'ios/testproject/PrivacyInfo.xcprivacy';

const originalFs = jest.requireActual('fs');

describe('withPrivacyInfo', () => {
  afterEach(() => vol.reset());
  it('adds PrivacyInfo.xcprivacy file to the project and merges with existing file', async () => {
    // mock the data in the PrivacyInfo.xcprivacy file using vol
    vol.fromJSON(
      {
        'ios/testproject/PrivacyInfo.xcprivacy': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/PrivacyInfo.xcprivacy'),
          'utf-8'
        ),
      },
      projectRoot
    );

    setPrivacyInfo(mockConfig, privacyManifests);
    expect(vol.readFileSync(path.join(projectRoot, filePath), 'utf-8')).toMatchSnapshot();
  });
});
