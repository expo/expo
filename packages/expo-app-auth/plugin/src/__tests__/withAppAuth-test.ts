import { setGradlePlaceholders } from '../withAppAuth';

const buildGradleFixture = `
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    defaultConfig {
        applicationId "com.helloworld"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }
    applicationVariants.all { variant ->
        variant.outputs.each { output ->
            def versionCodes = ["armeabi-v7a": 1, "x86": 2, "arm64-v8a": 3, "x86_64": 4]
            def abi = output.getFilter(OutputFile.ABI)
            if (abi != null) {  // null for the universal-debug, universal-release variants
                output.versionCodeOverride =
                        versionCodes.get(abi) * 1048576 + defaultConfig.versionCode
            }

        }
    }
}
`;

describe(setGradlePlaceholders, () => {
  it(`adds placeholders to gradle`, () => {
    expect(setGradlePlaceholders(buildGradleFixture, 'kirkland-brand')).toMatchSnapshot();
  });
});
