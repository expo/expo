/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI43_0_0FBReactNativeSpec/ABI43_0_0FBReactNativeSpec.h>

#import <ABI43_0_0React/ABI43_0_0RCTI18nUtil.h>
#import "ABI43_0_0RCTI18nManager.h"

#import "ABI43_0_0CoreModulesPlugins.h"

using namespace ABI43_0_0facebook::ABI43_0_0React;

@interface ABI43_0_0RCTI18nManager () <ABI43_0_0NativeI18nManagerSpec>
@end

@implementation ABI43_0_0RCTI18nManager

ABI43_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI43_0_0RCT_EXPORT_METHOD(allowRTL : (BOOL)value)
{
  [[ABI43_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI43_0_0RCT_EXPORT_METHOD(forceRTL : (BOOL)value)
{
  [[ABI43_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI43_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL : (BOOL)value)
{
  [[ABI43_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[ABI43_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL" : @([[ABI43_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeI18nManagerSpecJSI>(params);
}

@end

Class ABI43_0_0RCTI18nManagerCls(void)
{
  return ABI43_0_0RCTI18nManager.class;
}
