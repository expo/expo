import { vol } from 'memfs';
import path from 'path';

import { generateAasaForProject, getUserDefinedAasaFile } from '../aasa';

describe(getUserDefinedAasaFile, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`should return null when the file doesn't exist`, () => {
    vol.fromJSON({}, '/public');
    expect(getUserDefinedAasaFile('/')).toEqual(null);
  });
  it(`should return the user defined aasa files`, () => {
    vol.fromJSON(
      {
        '.well-known/apple-app-site-association': 'user defined aasa file',
        'apple-app-site-association': '{}',
      },
      '/public'
    );
    expect(getUserDefinedAasaFile('/')).toEqual('/public/apple-app-site-association');
  });
  it(`should return the less specific user defined aasa file`, () => {
    vol.fromJSON(
      {
        'apple-app-site-association': 'user defined aasa file',
      },
      '/public/.well-known'
    );
    expect(getUserDefinedAasaFile('/')).toEqual('/public/.well-known/apple-app-site-association');
  });
});

const originalFs = jest.requireActual('fs');

describe(generateAasaForProject, () => {
  afterEach(() => {
    delete process.env.EXPO_APPLE_TEAM_ID;
    vol.reset();
  });

  it(`returns aasa from pbxproj`, () => {
    vol.fromJSON(
      {
        'package.json': '{}',
        'ios/testproject.xcodeproj/project.pbxproj': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/aasa-project.pbxproj'),
          'utf-8'
        ),
      },
      '/'
    );
    expect(generateAasaForProject('/')).toEqual({});
  });
});
