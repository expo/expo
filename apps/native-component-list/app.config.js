// To prebuild:
// 1. `npm pack` in `../../templates/expo-template-bare-minimum`
// 2. `EXPO_SDK_VERSION=43.0.0 expo prebuild --clean --template --no-install ../../templates/expo-template-bare-minimum/expo-template-bare-minimum-42.0.0.tgz`
//   - This can be debugged with `EXPO_DEBUG=1` and `DEBUG=expo:*`
// 3. `pod install` in the ios folder. Do this in its own step since direnv may break your cocoapods install.
// 4. `EXPO_SDK_VERSION=43.0.0 expo run:ios --no-install`
//   - This can be debugged with `EXPO_DEBUG=1` and `DEBUG=expo:*`
// 5. `EXPO_SDK_VERSION=43.0.0 expo run:android`
export default ({ config }) => {
  config.version = '43.0.0';
  // app.json defines the sdkVersion as UNVERSIONED, we can override it here dynamically if we need to,
  // for example with an environment variable.
  if (process.env.EXPO_SDK_VERSION) {
    config.sdkVersion = process.env.EXPO_SDK_VERSION;
  }
  config.plugins = [
    // iOS plugins
    // Add a plugin to modify the AppDelegate.
    './plugins/withNotFoundModule',
    // Add the React DevMenu back to the client.
    './plugins/withDevMenu',
    // Add AsyncStorage
    './plugins/withExpoAsyncStorage',
    // Set the minimum version to 12 for Amplitude support
    ['./plugins/withPodfileMinVersion', '12.0'],

    // Android plugins

    // expo-modules-test-core requires kotlin, so additional setup must be executed.
    'expo-modules-test-core',
    [
      './plugins/withGradleProperties',
      {
        // Increase default java VM size so it can handle building all the Expo packages.
        'org.gradle.jvmargs':
          '-Xmx3g -XX:MaxPermSize=2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
      },
    ],
    [
      // expo-modules-test-core must be added manually.
      './plugins/withSettingsImport',
      {
        packageName: 'expo-modules-test-core',
        packagePath: '../../../packages/expo-modules-test-core/android',
      },
    ],
  ];

  config.plugins.push([
    'expo-document-picker',
    {
      appleTeamId: 'XXXXXX',
    },
  ]);

  config.plugins.push([
    'expo-notifications',
    {
      icon: './assets/icons/notificationIcon.png',
      color: '#5539cc',
      sounds: ['./assets/sounds/cat.wav'],
    },
  ]);

  // The dev client plugins shouldn't be installed
  config._internal.pluginHistory = {
    // expo-dev-launcher causes prebuild to freeze on a find/replace.
    'expo-dev-launcher': {},
    'expo-dev-menu': {},
    'expo-dev-client': {},
  };

  return config;
};
