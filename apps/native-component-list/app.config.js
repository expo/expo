export default ({ config }) => {
  config.version = '40.0.0';
  config.sdkVersion = '40.0.0';
  config.plugins = [
    // iOS plugins
    // Add a plugin to modify the AppDelegate.
    './plugins/withNotFoundModule',
    // Add the React DevMenu back to the client.
    './plugins/withDevMenu',
    // Add AsyncStorage
    './plugins/withExpoAsyncStorage',
    // Set the minimum version to 11 for Google Sign-In support -- TODO: Maybe this belongs in expo-google-sign-in?
    ['./plugins/withPodfileMinVersion', '11.0'],

    // Android plugins

    // unimodules-test-core requires kotlin, so additional setup must be executed.
    'unimodules-test-core',
    [
      './plugins/withGradleProperties',
      {
        // Increase default java VM size so it can handle building all the Expo packages.
        'org.gradle.jvmargs':
          '-Xmx3g -XX:MaxPermSize=2048m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8',
      },
    ],
    [
      // unimodules-test-core must be added manually.
      './plugins/withSettingsImport',
      {
        packageName: 'unimodules-test-core',
        packagePath: '../../../packages/unimodules-test-core/android',
      },
    ],
  ];

  config.plugins.push([
    'expo-payments-stripe',
    {
      scheme: 'ncl-payments',
      merchantId: 'merchant.com.example.development',
    },
  ]);

  return config;
};
