// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI15_0_0EXBlurViewManager.h"
#import "ABI15_0_0EXBlurView.h"

@implementation ABI15_0_0EXBlurViewManager

ABI15_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI15_0_0EXBlurView alloc] init];
}

ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI15_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
