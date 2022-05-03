import { IOSConfig } from '@expo/config-plugins';
import { vol } from 'memfs';
import path from 'path';

import {
  getCodeSigningInfoForPbxproj,
  mutateXcodeProjectWithAutoCodeSigningInfo,
} from '../xcodeCodeSigning';

jest.mock('fs');

const originalFs = jest.requireActual('fs');

describe(mutateXcodeProjectWithAutoCodeSigningInfo, () => {
  const projectRoot = '/';
  afterEach(() => vol.reset());

  it(`mutates the xcode project with code signing info`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/minimal.pbxproj'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const project = IOSConfig.XcodeUtils.resolvePathOrProject(projectRoot);

    mutateXcodeProjectWithAutoCodeSigningInfo({
      project,
      appleTeamId: '12345',
    });

    // PBXProject
    expect(
      project.hash.project.objects.PBXProject['X00000000000000000000000'].attributes
        .TargetAttributes['X00000000000000000000001'].DevelopmentTeam
    ).toBe('"12345"');
    delete project.hash.project.objects.PBXProject;

    // XCBuildConfiguration
    ['X00000000000000000000016', 'X00000000000000000000017'].forEach((key) => {
      expect(
        project.hash.project.objects.XCBuildConfiguration[key].buildSettings.DEVELOPMENT_TEAM
      ).toBe('"12345"');
    });
    delete project.hash.project.objects.XCBuildConfiguration;

    // No other changes should have been made
    expect(JSON.stringify(project.hash.project.objects)).not.toMatch(/12345/);
  });
});

describe(getCodeSigningInfoForPbxproj, () => {
  const projectRoot = '/testproject';

  afterEach(() => vol.reset());

  it(`returns the no existing code signing info`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
      },
      projectRoot
    );

    expect(getCodeSigningInfoForPbxproj(projectRoot)).toStrictEqual({
      '13B07F861A680F5B00A75B9A': {
        developmentTeams: [],
        provisioningProfiles: [],
      },
    });
  });
  it(`returns the existing code signing info`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/signed-project.pbxproj'),
          'utf-8'
        ),
      },
      projectRoot
    );

    expect(getCodeSigningInfoForPbxproj(projectRoot)).toStrictEqual({
      '13B07F861A680F5B00A75B9A': {
        developmentTeams: ['QQ57RJ5UTD', 'QQ57RJ5UTD'],
        provisioningProfiles: [],
      },
    });
  });
});
