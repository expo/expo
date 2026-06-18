import { vol } from 'memfs';
import path from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import type { PrivacyInfo } from '../PrivacyInfo';
import { setPrivacyInfo } from '../PrivacyInfo';
import { getPbxproj } from '../utils/Xcodeproj';

jest.mock('fs');

const originalFs = jest.requireActual('fs');

const projectRoot = '/myapp';
const project = { name: 'HelloWorld', slug: 'helloworld' };

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

describe('withPrivacyInfo', () => {
  afterEach(() => vol.reset());

  it('adds PrivacyInfo.xcprivacy file to the project and merges with existing file', () => {
    vol.fromJSON(
      {
        ...rnFixture,
        'ios/HelloWorld/PrivacyInfo.xcprivacy': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/PrivacyInfo.xcprivacy'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const pbxproj = getPbxproj(projectRoot);

    const mockConfig = {
      modResults: pbxproj,
      modRequest: {
        projectRoot,
        platformProjectRoot: path.join(projectRoot, 'ios'),
        modName: 'xcodeproj',
        platform: 'ios' as const,
        introspect: false,
      },
      modRawConfig: project,
      ...project,
    } as any;

    setPrivacyInfo(mockConfig, privacyManifests);

    // The PrivacyInfo.xcprivacy file on disk reflects the merged manifests.
    expect(
      vol.readFileSync(path.join(projectRoot, 'ios/HelloWorld/PrivacyInfo.xcprivacy'), 'utf-8')
    ).toMatchSnapshot();

    // The PrivacyInfo file is now registered in the pbxproj.
    expect(pbxproj.hasFile('HelloWorld/PrivacyInfo.xcprivacy')).toBeTruthy();

    // The file is wired into the resources build phase.
    const output = pbxproj.writeSync();
    const resourcesRegion = output.match(
      /Begin PBXResourcesBuildPhase[\s\S]*?End PBXResourcesBuildPhase/
    );
    expect(resourcesRegion?.[0]).toContain('PrivacyInfo.xcprivacy');
  });
});
