const baseDevClientE2E = {
  preset: 'detox',
  reactVersion: '17.0.1',
  reactNativeVersion: '0.67.3',
  detoxConfigFile: '.detoxrc.js',
  appEntryPoint: 'e2e/app/App.tsx',
  android: {
    mainApplication: 'e2e/android/MainApplication.java',
    mainActivity: 'e2e/android/MainActivity.java',
    detoxTestFile: 'e2e/android/DetoxTest.java',
  },
  ios: {
    appDelegate: 'e2e/ios/AppDelegate.m',
  },
  dependencies: [
    {
      name: 'expo',
      path: '../expo',
    },
    {
      name: 'expo-modules-core',
      path: '../expo-modules-core',
    },
    {
      name: 'expo-modules-autolinking',
      path: '../expo-modules-autolinking',
    },
    {
      name: 'expo-dev-client',
      path: '../expo-dev-client',
    },
    {
      name: 'expo-dev-launcher',
      path: '../expo-dev-launcher',
    },
    {
      name: 'expo-dev-menu',
      path: '../expo-dev-menu',
    },
    {
      name: 'expo-dev-menu-interface',
      path: '../expo-dev-menu-interface',
    },
    {
      name: 'expo-manifests',
      path: '../expo-manifests',
    },
    {
      name: 'expo-updates-interface',
      path: '../expo-updates-interface',
    },
  ],
  additionalFiles: ['e2e'],
};

module.exports = {
  applications: {
    'dev-client-e2e': {
      ...baseDevClientE2E,
      tests: {
        e2e: {
          shouldRunBundler: true,
          configurations: ['ios', 'android'],
        },
      },
    },
    'dev-client-latest-e2e': {
      ...baseDevClientE2E,
      reactNativeVersion: 'next',
      tests: {
        'latest-e2e': {
          shouldRunBundler: true,
          configurations: ['ios', 'android'],
        },
      },
    },
  },
};
