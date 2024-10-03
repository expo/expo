import fs from 'fs-extra';
import path from 'path';

import { Podspec } from '../../CocoaPods';
import { EXPO_GO_ANDROID_DIR, EXPO_GO_IOS_DIR, EXPOTOOLS_DIR } from '../../Constants';
import logger from '../../Logger';
import { applyPatchAsync } from '../../Utils';
import { VendoringTargetConfig } from '../types';

const config: VendoringTargetConfig = {
  name: 'Expo Go',
  platforms: {
    ios: {
      targetDirectory: path.join(EXPO_GO_IOS_DIR, 'vendored/unversioned'),
    },
    android: {
      targetDirectory: path.join(EXPO_GO_ANDROID_DIR, 'vendored/unversioned'),
    },
  },
  modules: {
    'amazon-cognito-identity-js': {
      source: 'https://github.com/aws-amplify/amplify-js.git',
    },
    'react-native-view-shot': {
      source: 'https://github.com/gre/react-native-view-shot.git',
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
              paths: 'RNCWebViewImpl.h',
              find: /@interface RNCWebViewImpl : RCTView/,
              replaceWith: '$&\n@property (nonatomic, strong) NSString *scopeKey;',
            },
            {
              paths: 'RNCWebViewImpl.m',
              find: /(\[\[RNCWKProcessPoolManager sharedManager\] sharedProcessPool)]/,
              replaceWith: '$1ForScopeKey:self.scopeKey]',
            },
            {
              paths: 'RNCWebViewManager.mm',
              find: /@implementation RNCWebViewManager\s*{/,
              replaceWith: '$&\n    NSString *_scopeKey;',
            },
            {
              paths: 'RNCWebViewManager.mm',
              find: 'return [[RNCWebViewImpl alloc] init];',
              replaceWith:
                'RNCWebViewImpl *webview = [[RNCWebViewImpl alloc] init];\n  webview.scopeKey = _scopeKey;\n  return webview;',
            },
            {
              paths: 'RNCWebViewManager.mm',
              find: /RCT_EXPORT_MODULE\(RNCWebView\)/,
              replaceWith: `RCT_EXPORT_MODULE(RNCWebView)

- (instancetype)initWithExperienceStableLegacyId:(NSString *)experienceStableLegacyId
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
    '@react-native-async-storage/async-storage': {
      source: 'https://github.com/react-native-async-storage/async-storage.git',
      rootDir: 'packages/default-storage',
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
