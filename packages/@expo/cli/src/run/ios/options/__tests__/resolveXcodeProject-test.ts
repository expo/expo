import { vol } from 'memfs';

import { resolveXcodeProject } from '../resolveXcodeProject';

describe(resolveXcodeProject, () => {
  afterEach(() => vol.reset());
  it(`resolves xcworkspace with higher priority than xcodeproj`, async () => {
    vol.fromJSON(
      {
        'ios/MyProject.xcworkspace': '',
        'ios/MyProject.xcodeproj': '',
      },
      '/'
    );

    await expect(resolveXcodeProject('/')).resolves.toEqual({
      name: '/ios/MyProject.xcworkspace',
      isWorkspace: true,
    });
  });
  it(`resolves xcodeproj if xcworkspace is not available`, async () => {
    vol.fromJSON(
      {
        'ios/MyProject.xcodeproj': '',
      },
      '/'
    );

    await expect(resolveXcodeProject('/')).resolves.toEqual({
      name: '/ios/MyProject.xcodeproj',
      isWorkspace: false,
    });
  });
  it(`throws if neither xcworkspace nor xcodeproj are available`, async () => {
    vol.fromJSON({}, '/');

    await expect(resolveXcodeProject('/')).rejects.toThrow(
      'Xcode project not found in project: /. You can generate a project with `npx expo prebuild`'
    );
  });
});
