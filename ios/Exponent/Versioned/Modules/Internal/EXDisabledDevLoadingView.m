// Copyright 2015-present 650 Industries. All rights reserved.

@import UIKit;

#import "EXDisabledDevLoadingView.h"

@implementation EXDisabledDevLoadingView

+ (NSString *)moduleName { return @"RCTDevLoadingView"; }

RCT_EXPORT_METHOD(hide)
{
  return;
}

RCT_EXPORT_METHOD(showMessage:(NSString *)message color:(UIColor *)color backgroundColor:(UIColor *)backgroundColor)
{
  return;
}

@end
