// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI20_0_0EXBlurViewManager.h"
#import "ABI20_0_0EXBlurView.h"

@implementation ABI20_0_0EXBlurViewManager

ABI20_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI20_0_0EXBlurView alloc] init];
}

ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI20_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
