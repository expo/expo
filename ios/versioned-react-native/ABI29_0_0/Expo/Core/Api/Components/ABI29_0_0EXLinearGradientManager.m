// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI29_0_0EXLinearGradientManager.h"
#import "ABI29_0_0EXLinearGradient.h"
#import <ReactABI29_0_0/ABI29_0_0RCTBridge.h>

@implementation ABI29_0_0EXLinearGradientManager

ABI29_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI29_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(startPoint, CGPoint);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(endPoint, CGPoint);
ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
