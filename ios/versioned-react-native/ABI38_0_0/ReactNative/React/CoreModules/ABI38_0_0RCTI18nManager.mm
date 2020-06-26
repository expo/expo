/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>

#import "ABI38_0_0RCTI18nManager.h"
#import <ABI38_0_0React/ABI38_0_0RCTI18nUtil.h>

#import "ABI38_0_0CoreModulesPlugins.h"

using namespace ABI38_0_0facebook::ABI38_0_0React;

@interface ABI38_0_0RCTI18nManager () <NativeI18nManagerSpec>
@end

@implementation ABI38_0_0RCTI18nManager

ABI38_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI38_0_0RCT_EXPORT_METHOD(allowRTL:(BOOL)value)
{
  [[ABI38_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI38_0_0RCT_EXPORT_METHOD(forceRTL:(BOOL)value)
{
  [[ABI38_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI38_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL:(BOOL)value)
{
  [[ABI38_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL": @([[ABI38_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL": @([[ABI38_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativeI18nManagerSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTI18nManagerCls(void) {
  return ABI38_0_0RCTI18nManager.class;
}
