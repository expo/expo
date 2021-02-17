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
      ios: {},
      // android: {
      //   includeFiles: 'src/android/**',
      //   excludeFiles: ['src/android/gradle.properties', 'src/android/gradle-maven-push.gradle'],
      // },
    },
    'react-native-gesture-handler': {
      source: 'https://github.com/software-mansion/react-native-gesture-handler.git',
      semverPrefix: '~',
    },
    'react-native-reanimated': {
      source: 'https://github.com/software-mansion/react-native-reanimated.git',
      semverPrefix: '~',
    },
    'react-native-screens': {
      source: 'https://github.com/software-mansion/react-native-screens.git',
      semverPrefix: '~',
    },
    'react-native-appearance': {
      source: 'https://github.com/expo/react-native-appearance.git',
      semverPrefix: '~',
    },
    'amazon-cognito-identity-js': {
      source: 'https://github.com/aws-amplify/amplify-js.git',
    },
    'react-native-view-shot': {
      source: 'https://github.com/gre/react-native-view-shot.git',
    },
    'react-native-svg': {
      source: 'https://github.com/react-native-community/react-native-svg.git',
    },
    'react-native-maps': {
      source: 'https://github.com/react-native-community/react-native-maps.git',
    },
    '@react-native-community/netinfo': {
      source: 'https://github.com/react-native-community/react-native-netinfo.git',
      ios: {},
    },
    'react-native-webview': {
      source: 'https://github.com/react-native-community/react-native-webview.git',
    },
    'react-native-safe-area-context': {
      source: 'https://github.com/th3rdwave/react-native-safe-area-context',
    },
    '@react-native-community/datetimepicker': {
      source: 'https://github.com/react-native-community/react-native-datetimepicker.git',
    },
    '@react-native-community/masked-view': {
      source: 'https://github.com/react-native-community/react-native-masked-view',
    },
    '@react-native-community/viewpager': {
      source: 'https://github.com/react-native-community/react-native-viewpager',
    },
    'react-native-shared-element': {
      source: 'https://github.com/IjzerenHein/react-native-shared-element',
    },
    '@react-native-community/segmented-control': {
      source: 'https://github.com/react-native-community/segmented-control',
    },
    '@react-native-picker/picker': {
      source: 'https://github.com/react-native-picker/picker',
    },
    '@react-native-community/slider': {
      source: 'https://github.com/react-native-community/react-native-slider',
    },
  },
};

export default config;
