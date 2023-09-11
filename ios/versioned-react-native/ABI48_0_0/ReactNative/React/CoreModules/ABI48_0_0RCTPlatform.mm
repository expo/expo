/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTPlatform.h"

#import <UIKit/UIKit.h>

#import <ABI48_0_0FBReactNativeSpec/ABI48_0_0FBReactNativeSpec.h>
#import <ABI48_0_0React/ABI48_0_0RCTUtils.h>
#import <ABI48_0_0React/ABI48_0_0RCTVersion.h>

#import "ABI48_0_0CoreModulesPlugins.h"

#import <folly/Optional.h>

using namespace ABI48_0_0facebook::ABI48_0_0React;

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

@interface ABI48_0_0RCTPlatform () <ABI48_0_0NativePlatformConstantsIOSSpec>
@end

@implementation ABI48_0_0RCTPlatform

ABI48_0_0RCT_EXPORT_MODULE(PlatformConstants)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

// TODO: Use the generated struct return type.
- (ModuleConstants<ABI48_0_0JS::NativePlatformConstantsIOS::Constants>)constantsToExport
{
  return (ModuleConstants<ABI48_0_0JS::NativePlatformConstantsIOS::Constants>)[self getConstants];
}

- (ModuleConstants<ABI48_0_0JS::NativePlatformConstantsIOS::Constants>)getConstants
{
  __block ModuleConstants<ABI48_0_0JS::NativePlatformConstantsIOS::Constants> constants;
  ABI48_0_0RCTUnsafeExecuteOnMainQueueSync(^{
    UIDevice *device = [UIDevice currentDevice];
    auto versions = ABI48_0_0RCTGetreactNativeVersion();
    constants = typedConstants<ABI48_0_0JS::NativePlatformConstantsIOS::Constants>({
        .forceTouchAvailable = ABI48_0_0RCTForceTouchAvailable() ? true : false,
        .osVersion = [device systemVersion],
        .systemName = [device systemName],
        .interfaceIdiom = interfaceIdiom([device userInterfaceIdiom]),
        .isTesting = ABI48_0_0RCTRunningInTestEnvironment() ? true : false,
        .reactNativeVersion = ABI48_0_0JS::NativePlatformConstantsIOS::ConstantsreactNativeVersion::Builder(
            {.minor = [versions[@"minor"] doubleValue],
             .major = [versions[@"major"] doubleValue],
             .patch = [versions[@"patch"] doubleValue],
             .prerelease = [versions[@"prerelease"] isKindOfClass:[NSNull class]]
                 ? folly::Optional<double>{}
                 : [versions[@"prerelease"] doubleValue]}),
    });
  });

  return constants;
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativePlatformConstantsIOSSpecJSI>(params);
}

@end

Class ABI48_0_0RCTPlatformCls(void)
{
  return ABI48_0_0RCTPlatform.class;
}
