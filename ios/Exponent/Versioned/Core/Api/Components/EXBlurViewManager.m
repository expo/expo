// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXBlurViewManager.h"
#import "EXBlurView.h"

@implementation EXBlurViewManager

RCT_EXPORT_MODULE(ExponentBlurViewManager);

- (UIView *)view
{
  return [[EXBlurView alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(tint, NSString);
RCT_EXPORT_VIEW_PROPERTY(intensity, NSNumber);

@end
