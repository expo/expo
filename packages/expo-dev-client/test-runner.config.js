module.exports = {
  applications: {
    'dev-client-e2e': {
      preset: 'detox',
      reactVersion: '17.0.1',
      reactNativeVersion: '0.64.2',
      detoxConfigFile: '.detoxrc.json',
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
      tests: {
        e2e: {
          shouldRunBundler: true,
          configurations: ['ios', 'android'],
        },
      },
    },
  },
};
