import { vol } from 'memfs';

import { resolveXcodeProject } from '../resolveXcodeProject';

describe(resolveXcodeProject, () => {
  afterEach(() => vol.reset());
  it(`resolves xcworkspace with higher priority than xcodeproj`, () => {
    vol.fromJSON(
      {
        'ios/MyProject.xcworkspace': '',
        'ios/MyProject.xcodeproj': '',
      },
      '/'
    );

    expect(resolveXcodeProject('/')).toEqual({
      name: '/ios/MyProject.xcworkspace',
      isWorkspace: true,
    });
  });
  it(`resolves xcodeproj if xcworkspace is not available`, () => {
    vol.fromJSON(
      {
        'ios/MyProject.xcodeproj': '',
      },
      '/'
    );

    expect(resolveXcodeProject('/')).toEqual({
      name: '/ios/MyProject.xcodeproj',
      isWorkspace: false,
    });
  });
  it(`throws if neither xcworkspace nor xcodeproj are available`, () => {
    vol.fromJSON({}, '/');

    expect(() => resolveXcodeProject('/')).toThrowError(
      'Xcode project not found in project: /. You can generate a project with `npx expo prebuild`'
    );
  });
});
