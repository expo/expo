// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXBlurViewManager.h"
#import "ABI28_0_0EXBlurView.h"

@implementation ABI28_0_0EXBlurViewManager

ABI28_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI28_0_0EXBlurView alloc] init];
}

ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI28_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
