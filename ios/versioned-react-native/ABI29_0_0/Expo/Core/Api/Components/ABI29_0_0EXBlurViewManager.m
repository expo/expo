// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXBlurViewManager.h"
#import "ABI29_0_0EXBlurView.h"

@implementation ABI29_0_0EXBlurViewManager

ABI29_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI29_0_0EXBlurView alloc] init];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
