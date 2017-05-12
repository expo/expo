// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI17_0_0EXLinearGradientManager.h"
#import "ABI17_0_0EXLinearGradient.h"
#import <ReactABI17_0_0/ABI17_0_0RCTBridge.h>

@implementation ABI17_0_0EXLinearGradientManager

ABI17_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI17_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(start, CGPoint);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(end, CGPoint);
ABI17_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
