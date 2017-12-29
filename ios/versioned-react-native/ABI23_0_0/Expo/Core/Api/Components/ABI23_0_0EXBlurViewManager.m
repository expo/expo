// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI23_0_0EXBlurViewManager.h"
#import "ABI23_0_0EXBlurView.h"

@implementation ABI23_0_0EXBlurViewManager

ABI23_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI23_0_0EXBlurView alloc] init];
}

ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI23_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
