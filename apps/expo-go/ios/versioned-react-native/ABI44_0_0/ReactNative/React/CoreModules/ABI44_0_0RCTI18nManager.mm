/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI44_0_0FBReactNativeSpec/ABI44_0_0FBReactNativeSpec.h>

#import <ABI44_0_0React/ABI44_0_0RCTI18nUtil.h>
#import "ABI44_0_0RCTI18nManager.h"

#import "ABI44_0_0CoreModulesPlugins.h"

using namespace ABI44_0_0facebook::ABI44_0_0React;

@interface ABI44_0_0RCTI18nManager () <ABI44_0_0NativeI18nManagerSpec>
@end

@implementation ABI44_0_0RCTI18nManager

ABI44_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI44_0_0RCT_EXPORT_METHOD(allowRTL : (BOOL)value)
{
  [[ABI44_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI44_0_0RCT_EXPORT_METHOD(forceRTL : (BOOL)value)
{
  [[ABI44_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI44_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL : (BOOL)value)
{
  [[ABI44_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL" : @([[ABI44_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL" : @([[ABI44_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeI18nManagerSpecJSI>(params);
}

@end

Class ABI44_0_0RCTI18nManagerCls(void)
{
  return ABI44_0_0RCTI18nManager.class;
}
