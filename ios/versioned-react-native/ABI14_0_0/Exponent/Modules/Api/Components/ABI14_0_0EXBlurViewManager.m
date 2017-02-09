// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI14_0_0EXBlurViewManager.h"
#import "ABI14_0_0EXBlurView.h"

@implementation ABI14_0_0EXBlurViewManager

ABI14_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI14_0_0EXBlurView alloc] init];
}

ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI14_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
