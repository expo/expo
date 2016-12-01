// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI12_0_0EXBlurViewManager.h"
#import "ABI12_0_0EXBlurView.h"

@implementation ABI12_0_0EXBlurViewManager

ABI12_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI12_0_0EXBlurView alloc] init];
}

ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI12_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
