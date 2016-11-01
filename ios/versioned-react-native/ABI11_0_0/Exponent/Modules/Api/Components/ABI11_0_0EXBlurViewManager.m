// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXBlurViewManager.h"
#import "ABI11_0_0EXBlurView.h"

@implementation ABI11_0_0EXBlurViewManager

ABI11_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI11_0_0EXBlurView alloc] init];
}

ABI11_0_0RCT_EXPORT_VIEW_PROPERTY(tintEffect, NSString);

@end
