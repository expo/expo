// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXBlurViewManager.h"
#import "ABI26_0_0EXBlurView.h"

@implementation ABI26_0_0EXBlurViewManager

ABI26_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI26_0_0EXBlurView alloc] init];
}

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
