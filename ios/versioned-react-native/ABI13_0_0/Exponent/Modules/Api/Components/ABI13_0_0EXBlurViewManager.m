// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI13_0_0EXBlurViewManager.h"
#import "ABI13_0_0EXBlurView.h"

@implementation ABI13_0_0EXBlurViewManager

ABI13_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI13_0_0EXBlurView alloc] init];
}

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
