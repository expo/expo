/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTI18nManager.h"
#import "ABI35_0_0RCTI18nUtil.h"

@implementation ABI35_0_0RCTI18nManager

ABI35_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI35_0_0RCT_EXPORT_METHOD(allowRTL:(BOOL)value)
{
  [[ABI35_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI35_0_0RCT_EXPORT_METHOD(forceRTL:(BOOL)value)
{
  [[ABI35_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI35_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL:(BOOL)value)
{
  [[ABI35_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary *)getConstants
{
  return @{
    @"isRTL": @([[ABI35_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL": @([[ABI35_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

@end
