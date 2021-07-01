import { Podspec } from '../../CocoaPods';
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
    'stripe-react-native': {
      source: 'https://github.com/stripe/stripe-react-native.git',
      ios: {},
      // android: {
      //   includeFiles: 'android/**',
      //   excludeFiles: ['android/gradle.properties', 'android/.settings', 'android/.project'],
      // },
    },
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
      ios: {
        // TODO: The podspec checks RN version to choose between Folly and RCT-Folly dependency,
        // however we don't have RN's package.json in the place where it looks for and the fallback
        // is set to `0.64.0` that we don't support yet.
        // You can remove these mutations once we update RN to 0.64 or higher.
        mutatePodspec(podspec: Podspec) {
          // Depend on Folly instead of RCT-Folly
          delete podspec.dependencies['RCT-Folly'];
          podspec.dependencies.Folly = [];

          // Overwrite search paths for Folly
          [podspec.pod_target_xcconfig, podspec.xcconfig].forEach((xcconfig) => {
            xcconfig.HEADER_SEARCH_PATHS = xcconfig.HEADER_SEARCH_PATHS.replace(
              '/RCT-Folly',
              '/Folly'
            );
          });

          // Fix compiler flags
          podspec.compiler_flags = podspec.compiler_flags.replace('RNVERSION=64', 'RNVERSION=63');
          podspec.xcconfig.OTHER_CFLAGS = podspec.xcconfig.OTHER_CFLAGS.replace(
            'RNVERSION=64',
            'RNVERSION=63'
          );
        },
      },
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
                '- (WKProcessPool *)sharedProcessPoolForExperienceScopeKey:(NSString *)experienceScopeKey;',
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

- (WKProcessPool *)sharedProcessPoolForExperienceScopeKey:(NSString *)experienceScopeKey
{
  if (!experienceScopeKey) {
    return [self sharedProcessPool];
  }
  if (!_pools[experienceScopeKey]) {
    _pools[experienceScopeKey] = [[WKProcessPool alloc] init];
  }
  return _pools[experienceScopeKey];
}
`,
            },
            {
              paths: 'RNCWebView.h',
              find: /@interface RNCWebView : RCTView/,
              replaceWith: '$&\n@property (nonatomic, strong) NSString *experienceScopeKey;',
            },
            {
              paths: 'RNCWebView.m',
              find: /(\[\[RNCWKProcessPoolManager sharedManager\] sharedProcessPool)]/,
              replaceWith: '$1ForExperienceScopeKey:self.experienceScopeKey]',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: /@implementation RNCWebViewManager\s*{/,
              replaceWith: '$&\n  NSString *_experienceScopeKey;',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: '*webView = [RNCWebView new];',
              replaceWith:
                '*webView = [RNCWebView new];\n  webView.experienceScopeKey = _experienceScopeKey;',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: /RCT_EXPORT_MODULE\(\)/,
              replaceWith: `- (instancetype)initWithExperienceScopeKey:(NSString *)experienceScopeKey
               kernelServiceDelegate:(id)kernelServiceInstance
                              params:(NSDictionary *)params
{
  if (self = [super init]) {
    _experienceScopeKey = experienceScopeKey;
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
      // TODO: Uncomment the following once the new vendoring scripts support Android
      // android: {
      //   transforms: {
      //     content: [
      //       {
      //         paths: 'RNTimePickerDialogFragment.java',
      //         find: /"ClockTimePickerDialog"/,
      //         replaceWith: '"ReactAndroidClockTimePickerDialog"',
      //       },
      //       {
      //         paths: 'RNTimePickerDialogFragment.java',
      //         find: /"SpinnerTimePickerDialog"/,
      //         replaceWith: '"ReactAndroidSpinnerTimePickerDialog"',
      //       },
      //       {
      //         paths: 'RNDatePickerDialogFragment.java',
      //         find: /"CalendarDatePickerDialog"/,
      //         replaceWith: '"ReactAndroidCalendarDatePickerDialog"',
      //       },
      //       {
      //         paths: 'RNDatePickerDialogFragment.java',
      //         find: /"SpinnerDatePickerDialog"/,
      //         replaceWith: '"ReactAndroidSpinnerDatePickerDialog"',
      //       },
      //     ],
      //   },
      // },
    },
    // NOTE(brentvatne): masked-view has been renamed to
    // @react-native-masked-view/masked-view but we should synchronize moving
    // over to the new package name along with React Navigation
    '@react-native-masked-view/masked-view': {
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
    },
    '@react-native-community/slider': {
      source: 'https://github.com/callstack/react-native-slider',
    },
  },
};

export default config;
