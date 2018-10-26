// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI31_0_0EXBlurViewManager.h"
#import "ABI31_0_0EXBlurView.h"

@implementation ABI31_0_0EXBlurViewManager

ABI31_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI31_0_0EXBlurView alloc] init];
}

ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI31_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
