// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXDisabledDevLoadingView.h"

@implementation ABI10_0_0EXDisabledDevLoadingView

+ (NSString *)moduleName { return @"ABI10_0_0RCTDevLoadingView"; }

ABI10_0_0RCT_EXPORT_METHOD(hide)
{
  return;
}

ABI10_0_0RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  return;
}

@end
