/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI41_0_0RCTPlatform.h"

#import <UIKit/UIKit.h>

#import <ABI41_0_0FBReactNativeSpec/ABI41_0_0FBReactNativeSpec.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>
#import <ABI41_0_0React/ABI41_0_0RCTVersion.h>

#import "ABI41_0_0CoreModulesPlugins.h"

using namespace ABI41_0_0facebook::ABI41_0_0React;

static NSString *interfaceIdiom(UIUserInterfaceIdiom idiom)
{
  switch (idiom) {
    case UIUserInterfaceIdiomPhone:
      return @"phone";
    case UIUserInterfaceIdiomPad:
      return @"pad";
    case UIUserInterfaceIdiomTV:
      return @"tv";
    case UIUserInterfaceIdiomCarPlay:
      return @"carplay";
    default:
      return @"unknown";
  }
}

@interface ABI41_0_0RCTPlatform () <ABI41_0_0NativePlatformConstantsIOSSpec>
@end

@implementation ABI41_0_0RCTPlatform

ABI41_0_0RCT_EXPORT_MODULE(PlatformConstants)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

// TODO: Use the generated struct return type.
- (ModuleConstants<JS::NativePlatformConstantsIOS::Constants>)constantsToExport
{
  return (ModuleConstants<JS::NativePlatformConstantsIOS::Constants>)[self getConstants];
}

- (ModuleConstants<JS::NativePlatformConstantsIOS::Constants>)getConstants
{
  UIDevice *device = [UIDevice currentDevice];
  auto versions = ABI41_0_0RCTGetreactNativeVersion();
  return typedConstants<JS::NativePlatformConstantsIOS::Constants>({
      .forceTouchAvailable = ABI41_0_0RCTForceTouchAvailable() ? true : false,
      .osVersion = [device systemVersion],
      .systemName = [device systemName],
      .interfaceIdiom = interfaceIdiom([device userInterfaceIdiom]),
      .isTesting = ABI41_0_0RCTRunningInTestEnvironment() ? true : false,
      .reactNativeVersion = JS::NativePlatformConstantsIOS::ConstantsreactNativeVersion::Builder(
          {.minor = [versions[@"minor"] doubleValue],
           .major = [versions[@"major"] doubleValue],
           .patch = [versions[@"patch"] doubleValue],
           .prerelease = [versions[@"prerelease"] isKindOfClass:[NSNull class]]
               ? folly::Optional<double>{}
               : [versions[@"prerelease"] doubleValue]}),
  });
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
                                              nativeInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
                                                 perfLogger:(id<ABI41_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<NativePlatformConstantsIOSSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI41_0_0RCTPlatformCls(void)
{
  return ABI41_0_0RCTPlatform.class;
}
