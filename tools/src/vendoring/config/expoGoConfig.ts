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
      source: 'https://github.com/lottie-react-native/lottie-react-native.git',
      ios: {},
      // android: {
      //   includeFiles: 'src/android/**',
      //   excludeFiles: ['src/android/gradle.properties', 'src/android/gradle-maven-push.gradle'],
      // },
    },
    'react-native-gesture-handler': {
      source: 'https://github.com/software-mansion/react-native-gesture-handler.git',
      semverPrefix: '~',
      ios: {},
    },
    'react-native-reanimated': {
      source: 'https://github.com/software-mansion/react-native-reanimated.git',
      semverPrefix: '~',
    },
    'react-native-screens': {
      source: 'https://github.com/software-mansion/react-native-screens.git',
      semverPrefix: '~',
      ios: {},
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
      source: 'https://github.com/react-native-svg/react-native-svg',
    },
    'react-native-maps': {
      source: 'https://github.com/react-native-maps/react-native-maps',
    },
    '@react-native-community/netinfo': {
      source: 'https://github.com/react-native-netinfo/react-native-netinfo',
      ios: {},
    },
    'react-native-webview': {
      source: 'https://github.com/react-native-webview/react-native-webview.git',
      ios: {
        transforms: {
          // react-native-webview exposes `useSharedProcessPool` property which has to be handled differently in Expo Go.
          // After upgrading this library, please ensure that proper patch is in place.
          // See commit https://github.com/expo/expo/commit/3aeb66e33dc391399ea1c90fd166425130d17a12
          content: [
            {
              paths: 'RNCWKProcessPoolManager.h',
              find: '- (WKProcessPool *)sharedProcessPool;',
              replaceWith:
                '- (WKProcessPool *)sharedProcessPoolForExperienceId:(NSString *)experienceId;',
            },
            {
              paths: 'RNCWKProcessPoolManager.m',
              find: 'WKProcessPool *_sharedProcessPool;',
              replaceWith:
                'WKProcessPool *_sharedProcessPool;\n    NSMutableDictionary<NSString *, WKProcessPool *> *_pools;',
            },
            {
              paths: 'RNCWKProcessPoolManager.m',
              find: '@implementation RNCWKProcessPoolManager',
              replaceWith: `@implementation RNCWKProcessPoolManager

- (instancetype)init
{
  if (self = [super init]) {
    _pools = [NSMutableDictionary new];
  }
  return self;
}

- (WKProcessPool *)sharedProcessPoolForExperienceId:(NSString *)experienceId
{
  if (!experienceId) {
    return [self sharedProcessPool];
  }
  if (!_pools[experienceId]) {
    _pools[experienceId] = [[WKProcessPool alloc] init];
  }
  return _pools[experienceId];
}
`,
            },
            {
              paths: 'RNCWebView.h',
              find: /@interface RNCWebView : RCTView/,
              replaceWith: '$&\n@property (nonatomic, strong) NSString *experienceId;',
            },
            {
              paths: 'RNCWebView.m',
              find: /(\[\[RNCWKProcessPoolManager sharedManager\] sharedProcessPool)]/,
              replaceWith: '$1ForExperienceId:self.experienceId]',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: /@implementation RNCWebViewManager\s*{/,
              replaceWith: '$&\n  NSString *_experienceId;',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: '*webView = [RNCWebView new];',
              replaceWith: '*webView = [RNCWebView new];\n  webView.experienceId = _experienceId;',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: /RCT_EXPORT_MODULE\(\)/,
              replaceWith: `- (instancetype)initWithExperienceId:(NSString *)experienceId
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceId = experienceId;
  }
  return self;
}`,
            },
          ],
        },
      },
    },
    'react-native-safe-area-context': {
      source: 'https://github.com/th3rdwave/react-native-safe-area-context',
    },
    '@react-native-community/datetimepicker': {
      source: 'https://github.com/react-native-community/react-native-datetimepicker.git',
    },
    // NOTE(brentvatne): masked-view has been renamed to
    // @react-native-masked-view/masked-view but we should synchronize moving
    // over to the new package name along with React Navigation
    '@react-native-community/masked-view': {
      source: 'https://github.com/react-native-masked-view/masked-view',
    },
    '@react-native-community/viewpager': {
      source: 'https://github.com/callstack/react-native-viewpager',
      ios: {},
    },
    'react-native-shared-element': {
      source: 'https://github.com/IjzerenHein/react-native-shared-element',
    },
    '@react-native-segmented-control/segmented-control': {
      source: 'https://github.com/react-native-segmented-control/segmented-control',
      ios: {},
    },
    '@react-native-picker/picker': {
      source: 'https://github.com/react-native-picker/picker',
      ios: {},
    },
    '@react-native-community/slider': {
      source: 'https://github.com/callstack/react-native-slider',
    },
  },
};

export default config;
