/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI25_0_0RCTPlatform.h"

#import <UIKit/UIKit.h>

#import "ABI25_0_0RCTUtils.h"
#import "ABI25_0_0RCTVersion.h"

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

@implementation ABI25_0_0RCTPlatform

ABI25_0_0RCT_EXPORT_MODULE(PlatformConstants)

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  UIDevice *device = [UIDevice currentDevice];
  return @{
    @"forceTouchAvailable": @(ABI25_0_0RCTForceTouchAvailable()),
    @"osVersion": [device systemVersion],
    @"systemName": [device systemName],
    @"interfaceIdiom": interfaceIdiom([device userInterfaceIdiom]),
    @"isTesting": @(ABI25_0_0RCTRunningInTestEnvironment()),
    @"reactNativeVersion": ABI25_0_0RCT_REACT_NATIVE_VERSION,
  };
}

@end
