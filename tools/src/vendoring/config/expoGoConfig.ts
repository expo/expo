import { VendoringTargetConfig } from '../types';

const config: VendoringTargetConfig = {
  name: 'Expo Go',
  platforms: {
    ios: {
      targetDirectory: 'ios/vendored/unversioned',
    },
    android: {
      targetDirectory: 'android/vendored/unversioned',
    },
  },
  modules: {
    'lottie-react-native': {
      source: 'https://github.com/react-native-community/lottie-react-native.git',
      android: {
        includeFiles: 'src/android/**',
        excludeFiles: ['src/android/gradle.properties', 'src/android/gradle-maven-push.gradle'],
      },
    },
  },
};

export default config;
