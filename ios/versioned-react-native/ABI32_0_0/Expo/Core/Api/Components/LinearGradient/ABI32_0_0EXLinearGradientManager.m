// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI32_0_0EXLinearGradientManager.h"
#import "ABI32_0_0EXLinearGradient.h"
#import <ReactABI32_0_0/ABI32_0_0RCTBridge.h>

@implementation ABI32_0_0EXLinearGradientManager

ABI32_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI32_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(startPoint, CGPoint);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(endPoint, CGPoint);
ABI32_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
