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
  afterEach(() => {
    vol.reset();
  });

  it(`returns project path`, () => {
    vol.fromJSON(
      {
        'macos/my-app.xcodeproj/xcshareddata/xcschemes/my-app.xcscheme': '',
        'macos/my_app.xcodeproj/xcshareddata/xcschemes/my_app.xcscheme': '',
        'macos/clientTests.xcodeproj/xcshareddata/xcschemes/client.beta.xcscheme': '',
      },
      '/'
    );

    expect(findSchemeNames('/')).toStrictEqual(['client.beta', 'my_app', 'my-app']);
  });
});

describe(getPodfilePath, () => {
  afterEach(() => {
    vol.reset();
  });

  it('returns podfile path', () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/Podfile': 'content',
        'macos/TestPod.podspec': 'noop',
        'macos/testproject/AppDelegate.m': '',
      },
      '/app'
    );
    expect(getPodfilePath('/app')).toBe('/app/macos/Podfile');
  });

  it(`throws when no podfile is found`, () => {
    expect(() => getPodfilePath('/none')).toThrow(UnexpectedError);
  });
});

describe(getXcodeProjectPath, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`returns project path`, () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/Podfile': 'content',
        'macos/TestPod.podspec': 'noop',
        'macos/testproject/AppDelegate.m': '',
      },
      '/app'
    );
    expect(getXcodeProjectPath('/app')).toBe('/app/macos/testproject.xcodeproj');
  });

  it(`throws when no paths are found`, () => {
    expect(() => getXcodeProjectPath('/none')).toThrow(UnexpectedError);
  });

  it(`warns when multiple paths are found`, () => {
    vol.fromJSON(
      {
        'macos/otherproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    expect(getXcodeProjectPath('/app')).toBe('/app/macos/otherproject.xcodeproj');
    expect(WarningAggregator.addWarningMacOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "macos/otherproject.xcodeproj". Ignored paths: ["macos/testproject.xcodeproj"]'
    );
  });

  it(`selects xcodeproj based on alphabetical order, but picks direct children of macos directory first`, () => {
    vol.fromJSON(
      {
        'macos/otherproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/aa/otherproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/botherproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    expect(getXcodeProjectPath('/app')).toBe('/app/macos/botherproject.xcodeproj');
    expect(WarningAggregator.addWarningMacOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "macos/botherproject.xcodeproj". Ignored paths: ["macos/otherproject.xcodeproj","macos/testproject.xcodeproj","macos/aa/otherproject.xcodeproj"]'
    );
  });

  it(`warns when multiple paths are found`, () => {
    vol.fromJSON(
      {
        'macos/otherproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/testproject/AppDelegate.m': '',
      },
      '/app'
    );

    expect(getXcodeProjectPath('/app')).toBe('/app/macos/otherproject.xcodeproj');
    expect(WarningAggregator.addWarningMacOS).toHaveBeenLastCalledWith(
      'paths-xcodeproj',
      'Found multiple *.xcodeproj file paths, using "macos/otherproject.xcodeproj". Ignored paths: ["macos/testproject.xcodeproj"]'
    );
  });
  it(`ignores xcodeproj outside of the macos directory`, () => {
    vol.fromJSON(
      {
        'lib/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
      },
      '/app'
    );
    expect(() => getXcodeProjectPath('/app')).toThrow(UnexpectedError);
  });
});

describe(getAppDelegate, () => {
  beforeEach(() => {
    vol.reset();
  });
  afterAll(() => {
    vol.reset();
  });

  it(`returns objc path`, () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/Podfile': 'content',
        'macos/TestPod.podspec': 'noop',
        'macos/testproject/AppDelegate.m': '',
        'macos/testproject/AppDelegate.h': '',
      },
      '/objc'
    );

    expect(getAppDelegate('/objc')).toStrictEqual({
      contents: '',
      path: '/objc/macos/testproject/AppDelegate.m',
      language: 'objc',
    });
  });

  it(`returns C++ (objcpp) path`, () => {
    vol.fromJSON(rnFixture, '/');

    expect(getAppDelegate('/')).toStrictEqual({
      contents: expect.any(String),
      path: '/macos/HelloWorld/AppDelegate.mm',
      language: 'objcpp',
    });
  });

  it(`returns swift path`, () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/Podfile': 'content',
        'macos/TestPod.podspec': 'noop',
        'macos/testproject/AppDelegate.swift': '',
      },
      '/swift'
    );

    expect(getAppDelegate('/swift')).toStrictEqual({
      contents: '',
      path: '/swift/macos/testproject/AppDelegate.swift',
      language: 'swift',
    });
  });

  it(`throws on invalid project`, () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/Podfile': 'content',
        'macos/TestPod.podspec': 'noop',
      },
      '/invalid'
    );

    expect(() => getAppDelegate('/invalid')).toThrow(UnexpectedError);
    expect(() => getAppDelegate('/invalid')).toThrow(/AppDelegate/);
  });

  it(`warns when multiple paths are found`, () => {
    vol.fromJSON(
      {
        'macos/testproject.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/Podfile': 'content',
        'macos/TestPod.podspec': 'noop',
        'macos/testproject/AppDelegate.swift': '',
        'macos/testproject/AppDelegate.m': '',
        'macos/testproject/AppDelegate.h': '',
      },
      '/confusing'
    );

    expect(getAppDelegate('/confusing')).toStrictEqual({
      contents: '',
      path: '/confusing/macos/testproject/AppDelegate.m',
      language: 'objc',
    });
    expect(WarningAggregator.addWarningMacOS).toHaveBeenLastCalledWith(
      'paths-app-delegate',
      'Found multiple AppDelegate file paths, using "macos/testproject/AppDelegate.m". Ignored paths: ["macos/testproject/AppDelegate.swift"]'
    );
  });
});

describe(getAllInfoPlistPaths, () => {
  beforeAll(async () => {
    const project = {
      'ExampleE2E-tvOS/Info.plist': '',
      'ExampleE2E/Info.plist': '',
      'ExampleE2E-tvOSTests/Info.plist': '',
      'ExampleE2ETests/Info.plist': '',
    };
    vol.fromJSON(project, path.join('/app', 'macos'));
    vol.fromJSON(project, '/app');
  });

  afterAll(() => {
    vol.reset();
  });

  it(`gets paths in order`, () => {
    expect(getAllInfoPlistPaths('/app')).toStrictEqual([
      '/app/macos/ExampleE2E/Info.plist',
      '/app/macos/ExampleE2E-tvOS/Info.plist',
      '/app/macos/ExampleE2ETests/Info.plist',
      '/app/macos/ExampleE2E-tvOSTests/Info.plist',
    ]);
  });
});
