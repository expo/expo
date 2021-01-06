import { string } from 'getenv';

const VERSION = string('SDK_VERSION', '40.0.0');

export default ({ config }) => {
  config.version = '40.0.0'; // VERSION
  config.sdkVersion = '40.0.0'; //VERSION
  config.plugins = [
    //// iOS
    // Add a plugin to modify the AppDelegate
    './plugins/withNotFoundModule',
    ['./plugins/withPodfileMinVersion', '11.0'],

    //// Android
    [
      './plugins/withGradleProperties',
      {
        // Increase default java VM size so it can handle building all the Expo packages.
        'org.gradle.jvmargs':
          '-Xmx3g -XX:MaxPermSize=2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
      },
    ],
    [
      // unimodules-test-core requires Kotlin be added on Android.
      './plugins/withKotlinGradle',
      '1.3.50'
    ],
    [
      // unimodules-test-core must be added manually
      './plugins/withSettingsImport',
      {
        packageName: 'unimodules-test-core',
        packagePath: '../../../packages/unimodules-test-core/android'
      }
    ],
  ];
  return config;
};
