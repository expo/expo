// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXBlurViewManager.h"
#import "ABI30_0_0EXBlurView.h"

@implementation ABI30_0_0EXBlurViewManager

ABI30_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI30_0_0EXBlurView alloc] init];
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
