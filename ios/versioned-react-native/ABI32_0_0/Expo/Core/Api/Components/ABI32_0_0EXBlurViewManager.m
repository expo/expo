// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXBlurViewManager.h"
#import "ABI32_0_0EXBlurView.h"

@implementation ABI32_0_0EXBlurViewManager

ABI32_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI32_0_0EXBlurView alloc] init];
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
