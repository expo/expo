import { addCameraImport } from '../withCamera';

const buildGradleFixture = `
buildscript {
    ext {
        buildToolsVersion = "29.0.2"
        minSdkVersion = 21
        compileSdkVersion = 29
        targetSdkVersion = 29
    }
    repositories {
        google()
        jcenter()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:3.5.3")
    }
}

allprojects {
    repositories {
        mavenLocal()
        maven {
            url("$rootDir/../node_modules/react-native/android")
        }
        maven {
            url("$rootDir/../node_modules/jsc-android/dist")
        }
        google()
        jcenter()
        maven { url 'https://www.jitpack.io' }
    }
}
`;
describe(addCameraImport, () => {
  it(`modifies the build.gradle`, () => {
    expect(addCameraImport(buildGradleFixture).contents).toMatchSnapshot();
  });
});
