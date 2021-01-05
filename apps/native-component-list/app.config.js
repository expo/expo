import { string } from 'getenv';

const VERSION = string('SDK_VERSION', '40.0.0');

export default ({ config }) => {
  config.version = '40.0.0'; // VERSION
  config.sdkVersion = '40.0.0'; //VERSION
  config.plugins = [
    // Add a plugin to modify the AppDelegate
    './plugins/withNotFoundModule',
    ['./plugins/withPodfileMinVersion', '11.0'],
    [
      './plugins/withGradleProperties',
      {
        // Increase default java VM size so it can handle building all the Expo packages.
        'org.gradle.jvmargs':
          '-Xmx3g -XX:MaxPermSize=2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
        // These are general optimizations.
        'org.gradle.daemon': true,
        'org.gradle.parallel': true,
        'org.gradle.configureondemand': true,
      },
    ],
    [
      './plugins/withKotlinGradle',
      '1.3.50'
    ],
  ];
  return config;
};
