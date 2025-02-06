import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import { UnexpectedError } from '../../utils/errors';
import * as WarningAggregator from '../../utils/warnings';
import {
  findSchemeNames,
  getAllInfoPlistPaths,
  getAppDelegate,
  getXcodeProjectPath,
  getPodfilePath,
} from '../Paths';

jest.mock('fs');
jest.mock('../../utils/warnings');

describe(findSchemeNames, () => {
  const platform = 'ios';

  afterEach(() => {
    vol.reset();
  });

  it(`returns project path`, () => {
    vol.fromJSON(
      {
        'ios/my-app.xcodeproj/xcshareddata/xcschemes/my-app.xcscheme': '',
        'ios/my_app.xcodeproj/xcshareddata/xcschemes/my_app.xcscheme': '',
        'ios/clientTests.xcodeproj/xcshareddata/xcschemes/client.beta.xcscheme': '',
      },
      '/'
    );

    expect(findSchemeNames('/', platform)).toStrictEqual(['client.beta', 'my_app', 'my-app']);
  });
});

describe(getPodfilePath, () => {
  const platform = 'ios';

  afterEach(() => {
    vol.reset();
  });

  it('returns podfile path', () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.m': '',
      },
      '/app'
    );
    expect(getPodfilePath('/app', platform)).toBe('/app/ios/Podfile');
  });

  it(`throws when no podfile is found`, () => {
    const platform = 'ios';

    expect(() => getPodfilePath('/none', platform)).toThrow(UnexpectedError);
  });
});

describe(getXcodeProjectPath, () => {
  const platform = 'ios';

  afterEach(() => {
    vol.reset();
  });

  it(`returns project path`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.m': '',
      },
      '/app'
    );
    expect(getXcodeProjectPath('/app', platform)).toBe('/app/ios/testproject.xcodeproj');
  });

  it(`throws when no paths are found`, () => {
    expect(() => getXcodeProjectPath('/none', platform)).toThrow(UnexpectedError);
  });

  it(`warns when multiple paths are found`, () => {
    vol.fromJSON(
      {
        'ios/otherproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    expect(getXcodeProjectPath('/app', platform)).toBe('/app/ios/otherproject.xcodeproj');
    expect(WarningAggregator.addWarningIOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "ios/otherproject.xcodeproj". Ignored paths: ["ios/testproject.xcodeproj"]'
    );
  });

  it(`selects xcodeproj based on alphabetical order, but picks direct children of ios directory first`, () => {
    vol.fromJSON(
      {
        'ios/otherproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/aa/otherproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/botherproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    expect(getXcodeProjectPath('/app', platform)).toBe('/app/ios/botherproject.xcodeproj');
    expect(WarningAggregator.addWarningIOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "ios/botherproject.xcodeproj". Ignored paths: ["ios/otherproject.xcodeproj","ios/testproject.xcodeproj","ios/aa/otherproject.xcodeproj"]'
    );
  });

  it(`warns when multiple paths are found`, () => {
    vol.fromJSON(
      {
        'ios/otherproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    expect(getXcodeProjectPath('/app', platform)).toBe('/app/ios/otherproject.xcodeproj');
    expect(WarningAggregator.addWarningIOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "ios/otherproject.xcodeproj". Ignored paths: ["ios/testproject.xcodeproj"]'
    );
  });
  it(`ignores xcodeproj outside of the ios directory`, () => {
    vol.fromJSON(
      {
        'lib/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
      },
      '/app'
    );
    expect(() => getXcodeProjectPath('/app', platform)).toThrow(UnexpectedError);
  });
});

describe(getAppDelegate, () => {
  const platform = 'ios';

  beforeEach(() => {
    vol.reset();
  });
  afterAll(() => {
    vol.reset();
  });

  it(`returns objc path`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.m': '',
        'ios/testproject/AppDelegate.h': '',
      },
      '/objc'
    );

    expect(getAppDelegate('/objc', platform)).toStrictEqual({
      contents: '',
      path: '/objc/ios/testproject/AppDelegate.m',
      language: 'objc',
    });
  });

  it(`returns Swift path`, () => {
    vol.fromJSON(rnFixture, '/');

    expect(getAppDelegate('/', platform)).toStrictEqual({
      contents: expect.any(String),
      path: '/ios/HelloWorld/AppDelegate.swift',
      language: 'swift',
    });
  });

  it(`returns swift path`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.swift': '',
      },
      '/swift'
    );

    expect(getAppDelegate('/swift', platform)).toStrictEqual({
      contents: '',
      path: '/swift/ios/testproject/AppDelegate.swift',
      language: 'swift',
    });
  });

  it(`throws on invalid project`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
      },
      '/invalid'
    );

    expect(() => getAppDelegate('/invalid', platform)).toThrow(UnexpectedError);
    expect(() => getAppDelegate('/invalid', platform)).toThrow(/AppDelegate/);
  });

  it(`warns when multiple paths are found`, () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/Podfile': 'content',
        'ios/TestPod.podspec': 'noop',
        'ios/testproject/AppDelegate.swift': '',
        'ios/testproject/AppDelegate.m': '',
        'ios/testproject/AppDelegate.h': '',
      },
      '/confusing'
    );

    expect(getAppDelegate('/confusing', platform)).toStrictEqual({
      contents: '',
      path: '/confusing/ios/testproject/AppDelegate.m',
      language: 'objc',
    });
    expect(WarningAggregator.addWarningIOS).toHaveBeenLastCalledWith(
      'paths-app-delegate',
      'Found multiple AppDelegate file paths, using "ios/testproject/AppDelegate.m". Ignored paths: ["ios/testproject/AppDelegate.swift"]'
    );
  });
});

describe(getAllInfoPlistPaths, () => {
  const platform = 'ios';

  beforeAll(async () => {
    const project = {
      'ExampleE2E-tvOS/Info.plist': '',
      'ExampleE2E/Info.plist': '',
      'ExampleE2E-tvOSTests/Info.plist': '',
      'ExampleE2ETests/Info.plist': '',
    };
    vol.fromJSON(project, path.join('/app', 'ios'));
    vol.fromJSON(project, '/app');
  });

  afterAll(() => {
    vol.reset();
  });

  it(`gets paths in order`, () => {
    expect(getAllInfoPlistPaths('/app', platform)).toStrictEqual([
      '/app/ios/ExampleE2E/Info.plist',
      '/app/ios/ExampleE2E-tvOS/Info.plist',
      '/app/ios/ExampleE2ETests/Info.plist',
      '/app/ios/ExampleE2E-tvOSTests/Info.plist',
    ]);
  });
});
