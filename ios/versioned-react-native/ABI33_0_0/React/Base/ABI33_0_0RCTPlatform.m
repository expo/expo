/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTPlatform.h"

#import <UIKit/UIKit.h>

#import "ABI33_0_0RCTUtils.h"
#import "ABI33_0_0RCTVersion.h"

static NSString *interfaceIdiom(UIUserInterfaceIdiom idiom) {
  switch(idiom) {
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

@implementation ABI33_0_0RCTPlatform

ABI33_0_0RCT_EXPORT_MODULE(PlatformConstants)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return [self getConstants];
}

- (NSDictionary<NSString *, id> *)getConstants
{
  UIDevice *device = [UIDevice currentDevice];
  return @{
    @"forceTouchAvailable": @(ABI33_0_0RCTForceTouchAvailable()),
    @"osVersion": [device systemVersion],
    @"systemName": [device systemName],
    @"interfaceIdiom": interfaceIdiom([device userInterfaceIdiom]),
    @"isTesting": @(ABI33_0_0RCTRunningInTestEnvironment()),
    @"reactNativeVersion": ABI33_0_0RCTGetreactNativeVersion(),
  };
}

@end
