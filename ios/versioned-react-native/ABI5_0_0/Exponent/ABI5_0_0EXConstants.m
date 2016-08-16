// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI5_0_0EXConstants.h"

@import UIKit.UIApplication;

@implementation ABI5_0_0EXConstants

ABI5_0_0RCT_EXPORT_MODULE(ExponentConstants);

- (CGFloat)_getStatusBarHeight
{
  CGSize statusBarSize = [UIApplication sharedApplication].statusBarFrame.size;
  return MIN(statusBarSize.width, statusBarSize.height);
}

- (NSDictionary *)constantsToExport
{
  return @{
    @"statusBarHeight": @([self _getStatusBarHeight]),
  };
}

@end
