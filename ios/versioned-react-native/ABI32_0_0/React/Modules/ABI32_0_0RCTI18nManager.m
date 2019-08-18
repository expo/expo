/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI32_0_0RCTI18nManager.h"
#import "ABI32_0_0RCTI18nUtil.h"

@implementation ABI32_0_0RCTI18nManager

ABI32_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI32_0_0RCT_EXPORT_METHOD(allowRTL:(BOOL)value)
{
  [[ABI32_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI32_0_0RCT_EXPORT_METHOD(forceRTL:(BOOL)value)
{
  [[ABI32_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI32_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL:(BOOL)value)
{
  [[ABI32_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"isRTL": @([[ABI32_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL": @([[ABI32_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

@end
