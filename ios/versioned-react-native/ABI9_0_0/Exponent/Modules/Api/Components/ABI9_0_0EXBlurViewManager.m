// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXBlurViewManager.h"
#import "ABI9_0_0EXBlurView.h"

@implementation ABI9_0_0EXBlurViewManager

ABI9_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI9_0_0EXBlurView alloc] init];
}

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(tintEffect, NSString);

@end
