// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI18_0_0EXBlurViewManager.h"
#import "ABI18_0_0EXBlurView.h"

@implementation ABI18_0_0EXBlurViewManager

ABI18_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI18_0_0EXBlurView alloc] init];
}

ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI18_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
