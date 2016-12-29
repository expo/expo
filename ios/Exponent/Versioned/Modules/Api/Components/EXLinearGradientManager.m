// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXLinearGradientManager.h"
#import "EXLinearGradient.h"
#import <React/RCTBridge.h>

@implementation EXLinearGradientManager

RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
RCT_EXPORT_VIEW_PROPERTY(start, CGPoint);
RCT_EXPORT_VIEW_PROPERTY(end, CGPoint);
RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
