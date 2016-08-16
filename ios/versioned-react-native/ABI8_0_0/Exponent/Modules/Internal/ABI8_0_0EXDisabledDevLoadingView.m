// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI8_0_0EXDisabledDevLoadingView.h"

@implementation ABI8_0_0EXDisabledDevLoadingView

+ (NSString *)moduleName { return @"ABI8_0_0RCTDevLoadingView"; }

ABI8_0_0RCT_EXPORT_METHOD(hide)
{
  return;
}

ABI8_0_0RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  return;
}

@end
