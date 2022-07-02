import * as WarningAggregator from '../../utils/warnings';
import {
  getVersionCode,
  getVersionName,
  setMinBuildScriptExtVersion,
  setVersionCode,
  setVersionName,
} from '../Version';

// TODO: use fixtures for manifest/build.gradle instead of inline strings

const EXAMPLE_BUILD_GRADLE = `
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion

    defaultConfig {
        applicationId "com.helloworld"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.2.3"
    }
}
`;

const EXAMPLE_BUILD_GRADLE_2 = `
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion

    defaultConfig {
        applicationId "com.helloworld"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 4
        versionName "2.0"
    }
}
`;

const EXAMPLE_PROJECT_BUILD_GRADLE = `
buildscript {
    ext {
        buildToolsVersion = "29.0.3"
        minSdkVersion = 21
        compileSdkVersion = 30
        targetSdkVersion = 30
        oddFormat = 30.2
    }
    repositories {
    }
    dependencies {
    }
}

allprojects {
    repositories {
        mavenLocal()
        maven {
            // Android JSC is installed from npm
            url(new File(["node", "--print", "require.resolve('jsc-android/package.json')"].execute(null, rootDir).text.trim(), "../dist"))
        }
    }
}
`;

describe('versionName', () => {
  it(`returns null if no version is provided`, () => {
    expect(getVersionName({})).toBe(null);
  });

  it(`returns the version name if provided`, () => {
    expect(getVersionName({ version: '1.2.3' })).toBe('1.2.3');
  });

  it(`sets the version name in build.gradle if version name is given`, () => {
    expect(setVersionName({ version: '1.2.3' }, EXAMPLE_BUILD_GRADLE)).toMatch(
      'versionName "1.2.3"'
    );
  });

  it(`replaces provided version name in build.gradle if version name is not the default`, () => {
    expect(setVersionName({ version: '1.2.3' }, EXAMPLE_BUILD_GRADLE_2)).toMatch(
      'versionName "1.2.3"'
    );
  });
});

describe('versionCode', () => {
  it(`returns 1 if no version code is provided`, () => {
    expect(getVersionCode({})).toBe(1);
  });

  it(`returns the version code if provided`, () => {
    expect(getVersionCode({ android: { versionCode: 5 } })).toBe(5);
  });

  it(`sets the version code in build.gradle if version code is given`, () => {
    expect(setVersionCode({ android: { versionCode: 5 } }, EXAMPLE_BUILD_GRADLE)).toMatch(
      'versionCode 5'
    );
  });

  it(`replaces provided version code in build.gradle if version code is given`, () => {
    expect(setVersionCode({ android: { versionCode: 5 } }, EXAMPLE_BUILD_GRADLE_2)).toMatch(
      'versionCode 5'
    );
  });
});

describe(setMinBuildScriptExtVersion, () => {
  beforeEach(() => {
    // @ts-ignore: jest
    // eslint-disable-next-line import/namespace
    WarningAggregator.addWarningAndroid = jest.fn();
  });

  it(`sets the minSdkVersion in build.gradle if minSdkVersion is given`, () => {
    expect(
      setMinBuildScriptExtVersion(EXAMPLE_PROJECT_BUILD_GRADLE, {
        name: 'minSdkVersion',
        minVersion: 22,
      })
    ).toMatch(/minSdkVersion = 22/);
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalled();
  });

  it(`sets the oddFormat in build.gradle if oddFormat is given`, () => {
    expect(
      setMinBuildScriptExtVersion(EXAMPLE_PROJECT_BUILD_GRADLE, {
        name: 'oddFormat',
        minVersion: 30.3,
      })
    ).toMatch(/oddFormat = 30\.3/);
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalled();
  });
  it(`does not change the compileSdkVersion in build.gradle if compileSdkVersion is lower than the existing value`, () => {
    expect(
      setMinBuildScriptExtVersion(EXAMPLE_PROJECT_BUILD_GRADLE, {
        name: 'compileSdkVersion',
        minVersion: 12,
      })
    ).toBe(EXAMPLE_PROJECT_BUILD_GRADLE);
    expect(WarningAggregator.addWarningAndroid).not.toHaveBeenCalled();
  });
  it(`warns when it cannot find the requested value`, () => {
    expect(
      setMinBuildScriptExtVersion(EXAMPLE_PROJECT_BUILD_GRADLE, {
        name: 'foobar',
        minVersion: 12,
      })
    ).toBe(EXAMPLE_PROJECT_BUILD_GRADLE);
    expect(WarningAggregator.addWarningAndroid).toBeCalledWith(
      'withBuildScriptExtVersion',
      'Cannot set minimum buildscript.ext.foobar version because the property "foobar" cannot be found or does not have a numeric value.'
    );
  });
  it(`does warns when targeting a property with a string value`, () => {
    expect(
      setMinBuildScriptExtVersion(EXAMPLE_PROJECT_BUILD_GRADLE, {
        name: 'buildToolsVersion',
        minVersion: 12,
      })
    ).toBe(EXAMPLE_PROJECT_BUILD_GRADLE);
    expect(WarningAggregator.addWarningAndroid).toBeCalledWith(
      'withBuildScriptExtVersion',
      'Cannot set minimum buildscript.ext.buildToolsVersion version because the property "buildToolsVersion" cannot be found or does not have a numeric value.'
    );
  });
});
