/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTI18nManager.h"
#import "ABI37_0_0RCTI18nUtil.h"

@implementation ABI37_0_0RCTI18nManager

ABI37_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI37_0_0RCT_EXPORT_METHOD(allowRTL:(BOOL)value)
{
  [[ABI37_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI37_0_0RCT_EXPORT_METHOD(forceRTL:(BOOL)value)
{
  [[ABI37_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI37_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL:(BOOL)value)
{
  [[ABI37_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL": @([[ABI37_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL": @([[ABI37_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

@end
