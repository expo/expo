/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI49_0_0FBReactNativeSpec/ABI49_0_0FBReactNativeSpec.h>

#import <ABI49_0_0React/ABI49_0_0RCTI18nUtil.h>
#import "ABI49_0_0RCTI18nManager.h"

#import "ABI49_0_0CoreModulesPlugins.h"

using namespace ABI49_0_0facebook::ABI49_0_0React;

@interface ABI49_0_0RCTI18nManager () <ABI49_0_0NativeI18nManagerSpec>
@end

@implementation ABI49_0_0RCTI18nManager

ABI49_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI49_0_0RCT_EXPORT_METHOD(allowRTL : (BOOL)value)
{
  [[ABI49_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI49_0_0RCT_EXPORT_METHOD(forceRTL : (BOOL)value)
{
  [[ABI49_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI49_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL : (BOOL)value)
{
  [[ABI49_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[ABI49_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL" : @([[ABI49_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeI18nManagerSpecJSI>(params);
}

@end

Class ABI49_0_0RCTI18nManagerCls(void)
{
  return ABI49_0_0RCTI18nManager.class;
}
