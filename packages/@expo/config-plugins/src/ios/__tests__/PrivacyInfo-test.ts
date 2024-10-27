import { vol } from 'memfs';
import path from 'path';

import { setPrivacyInfo, PrivacyInfo } from '../PrivacyInfo';
jest.mock('fs');

jest.mock('../utils/Xcodeproj', () => ({
  getProjectName: () => 'testproject',
  addResourceFileToGroup: jest.fn(),
}));

const projectRoot = 'myapp';

const project = {
  name: 'test',
  slug: 'test',
};

const mockConfig = {
  //fill in relevant data here
  modResults: {
    hasFile: () => false,
  },
  modRequest: {
    projectRoot,
    platformProjectRoot: path.join(projectRoot, 'ios'),
    modName: 'test',
    platform: 'ios' as const,
    introspect: false,
  },
  modRawConfig: project,
  ...project,
} as any;

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
        [filePath]: originalFs.readFileSync(
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
