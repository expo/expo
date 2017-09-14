// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXBlurViewManager.h"
#import "ABI21_0_0EXBlurView.h"

@implementation ABI21_0_0EXBlurViewManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI21_0_0EXBlurView alloc] init];
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
