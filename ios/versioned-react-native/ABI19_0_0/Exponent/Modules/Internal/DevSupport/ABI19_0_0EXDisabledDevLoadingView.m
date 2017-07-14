// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "ABI19_0_0EXDisabledDevLoadingView.h"

@implementation ABI19_0_0EXDisabledDevLoadingView

+ (NSString *)moduleName { return @"ABI19_0_0RCTDevLoadingView"; }

ABI19_0_0RCT_EXPORT_METHOD(hide)
{
  return;
}

ABI19_0_0RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  return;
}

@end
