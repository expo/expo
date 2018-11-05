/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTI18nManager.h"
#import "ABI30_0_0RCTI18nUtil.h"

@implementation ABI30_0_0RCTI18nManager

ABI30_0_0RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

ABI30_0_0RCT_EXPORT_METHOD(allowRTL:(BOOL)value)
{
  [[ABI30_0_0RCTI18nUtil sharedInstance] allowRTL:value];
}

ABI30_0_0RCT_EXPORT_METHOD(forceRTL:(BOOL)value)
{
  [[ABI30_0_0RCTI18nUtil sharedInstance] forceRTL:value];
}

ABI30_0_0RCT_EXPORT_METHOD(swapLeftAndRightInRTL:(BOOL)value)
{
  [[ABI30_0_0RCTI18nUtil sharedInstance] swapLeftAndRightInRTL:value];
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"isRTL": @([[ABI30_0_0RCTI18nUtil sharedInstance] isRTL]),
    @"doLeftAndRightSwapInRTL": @([[ABI30_0_0RCTI18nUtil sharedInstance] doLeftAndRightSwapInRTL])
  };
}

@end
