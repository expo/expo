import { vol } from 'memfs';
import path from 'path';

import { getCodeSigningInfoForPbxproj } from '../developmentCodeSigning';

jest.mock('fs');

const originalFs = jest.requireActual('fs');

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
