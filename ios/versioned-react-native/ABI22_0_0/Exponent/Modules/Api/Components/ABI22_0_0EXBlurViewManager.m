// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXBlurViewManager.h"
#import "ABI22_0_0EXBlurView.h"

@implementation ABI22_0_0EXBlurViewManager

ABI22_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI22_0_0EXBlurView alloc] init];
}

ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI22_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
