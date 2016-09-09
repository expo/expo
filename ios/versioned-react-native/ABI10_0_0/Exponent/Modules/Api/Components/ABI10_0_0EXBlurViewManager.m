// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXBlurViewManager.h"
#import "ABI10_0_0EXBlurView.h"

@implementation ABI10_0_0EXBlurViewManager

ABI10_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI10_0_0EXBlurView alloc] init];
}

ABI10_0_0RCT_EXPORT_VIEW_PROPERTY(tintEffect, NSString);

@end
