// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI21_0_0EXLinearGradientManager.h"
#import "ABI21_0_0EXLinearGradient.h"
#import <ReactABI21_0_0/ABI21_0_0RCTBridge.h>

@implementation ABI21_0_0EXLinearGradientManager

ABI21_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI21_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(start, CGPoint);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(end, CGPoint);
ABI21_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
