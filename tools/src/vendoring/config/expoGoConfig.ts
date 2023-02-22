import assert from 'assert';
import fs from 'fs-extra';
import path from 'path';

import { Podspec } from '../../CocoaPods';
import { EXPO_DIR, EXPOTOOLS_DIR, REACT_NATIVE_SUBMODULE_DIR } from '../../Constants';
import logger from '../../Logger';
import { transformFileAsync } from '../../Transforms';
import { applyPatchAsync } from '../../Utils';
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
        async mutatePodspec(podspec: Podspec) {
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
      android: {
        async postCopyFilesHookAsync(sourceDirectory: string, targetDirectory: string) {
          const buildGradlePath = path.join(targetDirectory, 'android', 'build.gradle');
          let buildGradle = await fs.readFile(buildGradlePath, 'utf-8');
          buildGradle = buildGradle.replace(
            'def shouldUseCommonInterfaceFromReanimated() {',
            'def shouldUseCommonInterfaceFromReanimated() {\n    return true\n'
          );
          buildGradle = buildGradle.replace(
            /react-native-reanimated/g,
            'vendored_unversioned_react-native-reanimated'
          );
          await fs.writeFile(buildGradlePath, buildGradle);
        },
        excludeFiles: [
          'android/gradle{/**,**}',
          'android/settings.gradle',
          'android/spotless.gradle',
        ],
      },
    },
    'react-native-reanimated': {
      source: 'https://github.com/software-mansion/react-native-reanimated.git',
      semverPrefix: '~',
      ios: {
        async preReadPodspecHookAsync(podspecPath: string): Promise<string> {
          const reaUtilsPath = path.join(podspecPath, '..', 'scripts', 'reanimated_utils.rb');
          assert(fs.existsSync(reaUtilsPath), 'Cannot find `reanimated_utils`.');
          const rnForkPath = path.join(REACT_NATIVE_SUBMODULE_DIR, '..');
          let content = await fs.readFile(reaUtilsPath, 'utf-8');
          content = content.replace(
            'react_native_node_modules_dir = ',
            `react_native_node_modules_dir = "${rnForkPath}" #`
          );
          await fs.writeFile(reaUtilsPath, content);
          return podspecPath;
        },
        async mutatePodspec(podspec: Podspec) {
          const rnForkPath = path.join(REACT_NATIVE_SUBMODULE_DIR, '..');
          const relativeForkPath = path.relative(path.join(EXPO_DIR, 'ios'), rnForkPath);
          podspec.xcconfig['HEADER_SEARCH_PATHS'] = podspec.xcconfig[
            'HEADER_SEARCH_PATHS'
          ]?.replace(rnForkPath, '${PODS_ROOT}/../' + relativeForkPath);
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
            {
              // remove the `#elif __has_include(<hermes/hermes.h>)` code block
              paths: 'NativeProxy.mm',
              find: /#elif __has_include\(<hermes\/hermes.h>\)\n.*(#import|makeHermesRuntime).*\n/gm,
              replaceWith: '',
            },
          ],
        },
      },
      android: {
        excludeFiles: [
          'android/gradle{/**,**}',
          'android/settings.gradle',
          'android/spotless.gradle',
          'android/README.md',
          'android/rnVersionPatch/**',
        ],
        async postCopyFilesHookAsync(sourceDirectory: string, targetDirectory: string) {
          await fs.copy(path.join(sourceDirectory, 'Common'), path.join(targetDirectory, 'Common'));
          const reanimatedVersion = require(path.join(sourceDirectory, 'package.json')).version;
          await transformFileAsync(path.join(targetDirectory, 'android', 'build.gradle'), [
            // set reanimated version
            {
              find: 'def REANIMATED_VERSION = getReanimatedVersion()',
              replaceWith: `def REANIMATED_VERSION = "${reanimatedVersion}"`,
            },
            {
              find: 'def REANIMATED_MAJOR_VERSION = getReanimatedMajorVersion()',
              replaceWith: `def REANIMATED_MAJOR_VERSION = ${reanimatedVersion.split('.')[0]}`,
            },
          ]);
        },
        transforms: {
          content: [
            {
              // Always uses hermes as reanimated worklet runtime on Expo Go
              paths: 'build.gradle',
              find: /\b(def JS_RUNTIME = \{)/g,
              replaceWith: '$1\n    return "hermes" // Expo Go always uses hermes\n',
            },
            {
              // react-native root dir is in react-native-lab/react-native
              paths: 'build.gradle',
              find: /\b(def reactNativeRootDir)\s*=.+$/gm,
              replaceWith: `$1 = Paths.get(projectDir.getPath(), '../../../../../react-native-lab/react-native').toFile()`,
            },
            {
              // no-op for extracting tasks
              paths: 'build.gradle',
              find: /\b(task (prepareHermes|unpackReactNativeAAR).*\{)$/gm,
              replaceWith: `$1\n    return`,
            },
            {
              // remove jsc extraction
              paths: 'build.gradle',
              find: /def jscAAR = .*\n.*extractSO.*jscAAR.*$/gm,
              replaceWith: '',
            },
            {
              // compileOnly hermes-engine
              paths: 'build.gradle',
              find: /implementation "com\.facebook\.react:hermes-android:?"\s*\/\/ version substituted by RNGP/g,
              replaceWith:
                'compileOnly "com.facebook.react:hermes-android:${REACT_NATIVE_VERSION}"',
            },
            {
              // find rn libs in ReactAndroid build output
              paths: 'CMakeLists.txt',
              find: 'set (RN_SO_DIR ${REACT_NATIVE_DIR}/ReactAndroid/src/main/jni/first-party/react/jni)',
              replaceWith:
                'set (RN_SO_DIR "${REACT_NATIVE_DIR}/ReactAndroid/build/intermediates/library_*/*/jni")',
            },
            {
              // find hermes from prefab
              paths: 'CMakeLists.txt',
              find: /(string\(APPEND CMAKE_CXX_FLAGS " -DJS_RUNTIME_HERMES=1"\))/g,
              replaceWith: `find_package(hermes-engine REQUIRED CONFIG)\n    $1`,
            },
            {
              // find hermes from prefab
              paths: 'CMakeLists.txt',
              find: /"\$\{BUILD_DIR\}\/.+\/libhermes\.so"/g,
              replaceWith: `hermes-engine::libhermes`,
            },
          ],
        },
      },
    },
    'react-native-screens': {
      source: 'https://github.com/software-mansion/react-native-screens.git',
      semverPrefix: '~',
      ios: {},
      android: {
        excludeFiles: [
          'android/gradle{/**,**}',
          'android/settings.gradle',
          'android/spotless.gradle',
        ],
      },
    },
    'amazon-cognito-identity-js': {
      source: 'https://github.com/aws-amplify/amplify-js.git',
    },
    'react-native-view-shot': {
      source: 'https://github.com/gre/react-native-view-shot.git',
    },
    'react-native-svg': {
      source: 'https://github.com/react-native-svg/react-native-svg',
      ios: {},
      android: {
        excludeFiles: [
          'android/gradle{/**,**}',
          'android/settings.gradle',
          'android/spotless.gradle',
          'android/src/fabric/**',
          'android/src/main/jni/**',
        ],
      },
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
      ios: {},
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
      android: {
        excludeFiles: ['android/gradle{/**,**}', 'android/settings.gradle'],
      },
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
      rootDir: 'package',
      ios: {},
      android: {
        includeFiles: 'android/**',
        excludeFiles: ['android/gradle{/**,**}'],
      },
    },
    '@shopify/react-native-skia': {
      source: '@shopify/react-native-skia',
      sourceType: 'npm',
      ios: {
        async mutatePodspec(podspec: Podspec, sourceDirectory: string, targetDirectory: string) {
          const vendoredRootDir = path.dirname(path.dirname(path.dirname(targetDirectory)));
          assert(path.basename(vendoredRootDir) === 'vendored');
          const vendoredCommonDir = path.join(vendoredRootDir, 'common');
          const vendoredFrameworks = podspec.ios?.vendored_frameworks ?? [];
          for (const framework of vendoredFrameworks) {
            // create symlink from node_modules/@shopify/react-native-skia to common lib dir
            const sourceFrameworkPath = path.join(
              EXPO_DIR,
              'node_modules/@shopify/react-native-skia',
              framework
            );
            const sharedFrameworkPath = path.join(vendoredCommonDir, path.basename(framework));
            await fs.unlink(sharedFrameworkPath);
            await fs.symlink(
              path.relative(path.dirname(sharedFrameworkPath), sourceFrameworkPath),
              sharedFrameworkPath
            );

            // create symlink from common lib dir to module dir, because podspec cannot specify files out of its dir.
            const symlinkFrameworkPath = path.join(targetDirectory, framework);
            await fs.ensureDir(path.dirname(symlinkFrameworkPath));
            await fs.symlink(
              path.relative(path.dirname(symlinkFrameworkPath), sharedFrameworkPath),
              symlinkFrameworkPath
            );
          }

          // Workaround React-bridging header search path for react-native 0.69 with `generate_multiple_pod_projects=true`
          if (!podspec.pod_target_xcconfig) {
            podspec.pod_target_xcconfig = {};
          }
          podspec.pod_target_xcconfig['HEADER_SEARCH_PATHS'] =
            '"$(PODS_ROOT)/Headers/Private/React-bridging/react/bridging" "$(PODS_CONFIGURATION_BUILD_DIR)/React-bridging/react_bridging.framework/Headers"';
        },
      },
      android: {
        includeFiles: ['android/**', 'cpp/**'],
        async postCopyFilesHookAsync(sourceDirectory, targetDirectory) {
          // create symlink from node_modules/@shopify/react-native-skia to common lib dir
          const libs = ['libskia.a', 'libskshaper.a', 'libsvg.a'];
          const archs = ['armeabi-v7a', 'arm64-v8a', 'x86', 'x86_64'];
          for (const lib of libs) {
            for (const arch of archs) {
              const sourceLibPath = path.join(
                EXPO_DIR,
                'node_modules/@shopify/react-native-skia/libs/android',
                arch,
                lib
              );
              const commonLibPath = path.join(targetDirectory, '../../../common/libs', arch, lib);
              await fs.ensureDir(path.dirname(commonLibPath));
              await fs.unlink(commonLibPath);
              await fs.symlink(
                path.relative(path.dirname(commonLibPath), sourceLibPath),
                commonLibPath
              );
            }
          }

          // patch gradle and cmake files
          const patchFile = path.join(
            EXPOTOOLS_DIR,
            'src/vendoring/config/react-native-skia.patch'
          );
          const patchContent = await fs.readFile(patchFile, 'utf8');
          try {
            await applyPatchAsync({
              patchContent,
              cwd: targetDirectory,
              stripPrefixNum: 0,
            });
          } catch (e) {
            logger.error(
              `Failed to apply patch: \`patch -p0 -d '${targetDirectory}' < ${patchFile}\``
            );
            throw e;
          }
        },
      },
    },
    '@shopify/flash-list': {
      source: 'https://github.com/Shopify/flash-list',
      ios: {},
      android: {
        excludeFiles: ['**/src/test/**'],
      },
    },
    '@react-native-async-storage/async-storage': {
      source: 'https://github.com/react-native-async-storage/async-storage.git',
      ios: {
        excludeFiles: 'example/**/*',
        async mutatePodspec(podspec: Podspec, sourceDirectory: string, targetDirectory: string) {
          // patch for scoped async storage
          const patchFile = path.join(
            EXPOTOOLS_DIR,
            'src/vendoring/config/react-native-async-storage-scoped-storage-ios.patch'
          );
          const patchContent = await fs.readFile(patchFile, 'utf8');
          try {
            await applyPatchAsync({
              patchContent,
              cwd: targetDirectory,
              stripPrefixNum: 0,
            });
          } catch (e) {
            logger.error(
              `Failed to apply patch: \`patch -p0 -d '${targetDirectory}' < ${patchFile}\``
            );
            throw e;
          }
        },
      },
      android: {
        excludeFiles: 'example/**/*',
        async postCopyFilesHookAsync(sourceDirectory, targetDirectory) {
          // patch for scoped async storage
          const patchFile = path.join(
            EXPOTOOLS_DIR,
            'src/vendoring/config/react-native-async-storage-scoped-storage-android.patch'
          );
          const patchContent = await fs.readFile(patchFile, 'utf8');
          try {
            await applyPatchAsync({
              patchContent,
              cwd: targetDirectory,
              stripPrefixNum: 0,
            });
          } catch (e) {
            logger.error(
              `Failed to apply patch: \`patch -p0 -d '${targetDirectory}' < ${patchFile}\``
            );
            throw e;
          }
        },
      },
    },
  },
};

export default config;
