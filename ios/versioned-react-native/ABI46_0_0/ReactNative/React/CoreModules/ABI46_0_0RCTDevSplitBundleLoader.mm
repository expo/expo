/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTDevSplitBundleLoader.h>

#import <ABI46_0_0FBReactNativeSpec/ABI46_0_0FBReactNativeSpec.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTBundleURLProvider.h>
#import <ABI46_0_0React/ABI46_0_0RCTConvert.h>
#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>
#import <ABI46_0_0React/ABI46_0_0RCTDevSettings.h>
#import <ABI46_0_0React/ABI46_0_0RCTUtils.h>

#import "ABI46_0_0CoreModulesPlugins.h"

using namespace ABI46_0_0facebook::ABI46_0_0React;

@interface ABI46_0_0RCTDevSplitBundleLoader () <ABI46_0_0NativeDevSplitBundleLoaderSpec>
@end

#if ABI46_0_0RCT_DEV_MENU | ABI46_0_0RCT_PACKAGER_LOADING_FUNCTIONALITY

@implementation ABI46_0_0RCTDevSplitBundleLoader

@synthesize bridge = _bridge;
@synthesize loadScript = _loadScript;
@synthesize moduleRegistry = _moduleRegistry;

ABI46_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI46_0_0RCT_EXPORT_METHOD(loadBundle
                  : (NSString *)bundlePath resolve
                  : (ABI46_0_0RCTPromiseResolveBlock)resolve reject
                  : (ABI46_0_0RCTPromiseRejectBlock)reject)
{
  NSURL *sourceURL = [[ABI46_0_0RCTBundleURLProvider sharedSettings] jsBundleURLForSplitBundleRoot:bundlePath];
  if (_bridge) {
    [_bridge loadAndExecuteSplitBundleURL:sourceURL
        onError:^(NSError *error) {
          reject(@"E_BUNDLE_LOAD_ERROR", [error localizedDescription], error);
        }
        onComplete:^() {
          resolve(@YES);
        }];
  } else {
    __weak __typeof(self) weakSelf = self;
    [ABI46_0_0RCTJavaScriptLoader loadBundleAtURL:sourceURL
        onProgress:^(ABI46_0_0RCTLoadingProgress *progressData) {
          // TODO: Setup loading bar.
        }
        onComplete:^(NSError *error, ABI46_0_0RCTSource *source) {
          if (error) {
            reject(@"E_BUNDLE_LOAD_ERROR", [error localizedDescription], error);
            return;
          }
          __typeof(self) strongSelf = weakSelf;
          strongSelf->_loadScript(source);
          ABI46_0_0RCTDevSettings *devSettings = [strongSelf->_moduleRegistry moduleForName:"ABI46_0_0RCTDevSettings"];
          [devSettings setupHMRClientWithAdditionalBundleURL:source.url];
          resolve(@YES);
        }];
  }
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevSplitBundleLoaderSpecJSI>(params);
}

@end

#else

@implementation ABI46_0_0RCTDevSplitBundleLoader

@synthesize loadScript = _loadScript;

+ (NSString *)moduleName
{
  return nil;
}
- (void)loadBundle:(NSString *)bundlePath resolve:(ABI46_0_0RCTPromiseResolveBlock)resolve reject:(ABI46_0_0RCTPromiseRejectBlock)reject;
{
}
- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeDevSplitBundleLoaderSpecJSI>(params);
}

@end

#endif

Class ABI46_0_0RCTDevSplitBundleLoaderCls(void)
{
  return ABI46_0_0RCTDevSplitBundleLoader.class;
}
