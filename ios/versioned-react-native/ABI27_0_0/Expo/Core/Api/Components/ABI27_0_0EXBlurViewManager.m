// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI27_0_0EXBlurViewManager.h"
#import "ABI27_0_0EXBlurView.h"

@implementation ABI27_0_0EXBlurViewManager

ABI27_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI27_0_0EXBlurView alloc] init];
}

ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI27_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
