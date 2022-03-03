import fs from 'fs-extra';
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
    '@stripe/stripe-react-native': {
      source: 'https://github.com/stripe/stripe-react-native.git',
      ios: {
        mutatePodspec(podspec: Podspec) {
          if (!podspec.pod_target_xcconfig) {
            podspec.pod_target_xcconfig = {};
          }
          podspec.pod_target_xcconfig['HEADER_SEARCH_PATHS'] =
            '"${PODS_ROOT}/Stripe/Stripe3DS2" "${PODS_ROOT}/Headers/Public/Stripe"';
        },
      },
      // android: {
      //   excludeFiles: [
      //     'android/src/main/java/com/reactnativestripesdk/GooglePayButtonManager.kt',
      //     'android/src/main/java/com/reactnativestripesdk/GooglePayButtonView.kt',
      //   ],
      //   transforms: {
      //     content: [
      //       {
      //         paths: 'StripeSdkPackage.kt',
      //         find: /, GooglePayButtonManager\(\)/,
      //         replaceWith: '',
      //       },
      //     ],
      //   },
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
        async preReadPodspecHookAsync(podspecPath: string): Promise<string> {
          let content = await fs.readFile(podspecPath, 'utf-8');
          content = content.replace("reactVersion = '0.66.0'", "reactVersion = '0.67.2'");
          content = content.replace(/(puts "\[RNReanimated\].*$)/gm, '# $1');
          await fs.writeFile(podspecPath, content);
          return podspecPath;
        },
        mutatePodspec(podspec: Podspec) {
          // TODO: The podspec checks RN version from package.json.
          // however we don't have RN's package.json in the place where it looks for and the fallback
          // is set to `0.66.0`.
          // currently we change the version in `preReadPodspecHookAsync`, once reanimated removed the `puts` in error message.
          // we should use the json based transformation here. that's why we keep the referenced code and comment out.
          // podspec.compiler_flags = podspec.compiler_flags.replace('RNVERSION=64', 'RNVERSION=63');
          // podspec.xcconfig.OTHER_CFLAGS = podspec.xcconfig.OTHER_CFLAGS.replace(
          //   'RNVERSION=64',
          //   'RNVERSION=63'
          // );
        },
        transforms: {
          content: [
            {
              paths: 'REAUIManager.mm',
              find: /^#import "RCT(.*).h"$/gm,
              replaceWith: '#import <React/RCT$1.h>',
            },
            {
              paths: 'REAPropsNode.m',
              find: /^#import "React\/RCT(.*).h"$/gm,
              replaceWith: '#import <React/RCT$1.h>',
            },
          ],
        },
      },
    },
    'react-native-screens': {
      source: 'https://github.com/software-mansion/react-native-screens.git',
      semverPrefix: '~',
      ios: {},
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
              replaceWith: '- (WKProcessPool *)sharedProcessPoolForScopeKey:(NSString *)scopeKey;',
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

- (WKProcessPool *)sharedProcessPoolForScopeKey:(NSString *)scopeKey
{
  if (!scopeKey) {
    return [self sharedProcessPool];
  }
  if (!_pools[scopeKey]) {
    _pools[scopeKey] = [[WKProcessPool alloc] init];
  }
  return _pools[scopeKey];
}
`,
            },
            {
              paths: 'RNCWebView.h',
              find: /@interface RNCWebView : RCTView/,
              replaceWith: '$&\n@property (nonatomic, strong) NSString *scopeKey;',
            },
            {
              paths: 'RNCWebView.m',
              find: /(\[\[RNCWKProcessPoolManager sharedManager\] sharedProcessPool)]/,
              replaceWith: '$1ForScopeKey:self.scopeKey]',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: /@implementation RNCWebViewManager\s*{/,
              replaceWith: '$&\n  NSString *_scopeKey;',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: '*webView = [RNCWebView new];',
              replaceWith: '*webView = [RNCWebView new];\n  webView.scopeKey = _scopeKey;',
            },
            {
              paths: 'RNCWebViewManager.m',
              find: /RCT_EXPORT_MODULE\(\)/,
              replaceWith: `- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
                                        scopeKey:(NSString *)scopeKey
                                    easProjectId:(NSString *)easProjectId
                           kernelServiceDelegate:(id)kernelServiceInstance
                                          params:(NSDictionary *)params
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
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
    'react-native-pager-view': {
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
