// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI30_0_0EXLinearGradientManager.h"
#import "ABI30_0_0EXLinearGradient.h"
#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>

@implementation ABI30_0_0EXLinearGradientManager

ABI30_0_0RCT_EXPORT_MODULE(ExponentLinearGradientManager);

@synthesize bridge = _bridge;

- (UIView *)view
{
  return [[ABI30_0_0EXLinearGradient alloc] init];
}

- (dispatch_queue_t)methodQueue
{
    return dispatch_get_main_queue();
}

ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(colors, NSArray);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(startPoint, CGPoint);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(endPoint, CGPoint);
ABI30_0_0RCT_EXPORT_VIEW_PROPERTY(locations, NSArray);

@end
