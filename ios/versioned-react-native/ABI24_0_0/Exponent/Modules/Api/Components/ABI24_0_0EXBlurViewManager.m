// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXBlurViewManager.h"
#import "ABI24_0_0EXBlurView.h"

@implementation ABI24_0_0EXBlurViewManager

ABI24_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI24_0_0EXBlurView alloc] init];
}

ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI24_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
