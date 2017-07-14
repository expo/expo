// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI19_0_0EXBlurViewManager.h"
#import "ABI19_0_0EXBlurView.h"

@implementation ABI19_0_0EXBlurViewManager

ABI19_0_0RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[ABI19_0_0EXBlurView alloc] init];
}

ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
ABI19_0_0RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
