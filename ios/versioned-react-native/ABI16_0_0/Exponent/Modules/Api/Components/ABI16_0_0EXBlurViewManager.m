// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI16_0_0EXBlurViewManager.h"
#import "ABI16_0_0EXBlurView.h"

@implementation ABI16_0_0EXBlurViewManager

ABI16_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI16_0_0EXBlurView alloc] init];
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
