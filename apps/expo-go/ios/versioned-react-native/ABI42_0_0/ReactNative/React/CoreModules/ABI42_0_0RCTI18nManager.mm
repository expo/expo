/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0FBReactNativeSpec/ABI42_0_0FBReactNativeSpec.h>

#import <ABI42_0_0React/ABI42_0_0RCTI18nUtil.h>
#import "ABI42_0_0RCTI18nManager.h"

#import "ABI42_0_0CoreModulesPlugins.h"

using namespace ABI42_0_0facebook::ABI42_0_0React;

@interface ABI42_0_0RCTI18nManager () <ABI42_0_0NativeI18nManagerSpec>
@end

@implementation ABI42_0_0RCTI18nManager

ABI42_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI42_0_0RCT_EXPORT_METHOD(allowRTL : (BOOL)value)
{
  [[ABI42_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI42_0_0RCT_EXPORT_METHOD(forceRTL : (BOOL)value)
{
  [[ABI42_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI42_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL : (BOOL)value)
{
  [[ABI42_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[ABI42_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL" : @([[ABI42_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
                                              nativeInvoker:(std::shared_ptr<CallInvoker>)nativeInvoker
                                                 perfLogger:(id<ABI42_0_0RCTTurboModulePerformanceLogger>)perfLogger
{
  return std::make_shared<NativeI18nManagerSpecJSI>(self, jsInvoker, nativeInvoker, perfLogger);
}

@end

Class ABI42_0_0RCTI18nManagerCls(void)
{
  return ABI42_0_0RCTI18nManager.class;
}
