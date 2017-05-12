// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXBlurViewManager.h"
#import "ABI17_0_0EXBlurView.h"

@implementation ABI17_0_0EXBlurViewManager

ABI17_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI17_0_0EXBlurView alloc] init];
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
