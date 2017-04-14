// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI16_0_0EXLinearGradientManager.h"
#import "ABI16_0_0EXLinearGradient.h"
#import <ReactABI16_0_0/ABI16_0_0RCTBridge.h>

@implementation ABI16_0_0EXLinearGradientManager

ABI16_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI16_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(start, CGPoint);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(end, CGPoint);
ABI16_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
