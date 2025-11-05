// Copyright 2015-present 650 Industries. All rights reserved.

#import "RNHostViewTouchHelper.h"

#import <React/RCTSurfaceTouchHandler.h>

@implementation RNHostViewTouchHelper

+ (nullable UIGestureRecognizer *)createTouchHandlerForView:(UIView *)view {
  RCTSurfaceTouchHandler *touchHandler = [[RCTSurfaceTouchHandler alloc] init];
  [touchHandler attachToView:view];
  return touchHandler;
}

+ (void)detachTouchHandler:(UIGestureRecognizer *)touchHandler fromView:(UIView *)view {
  if ([touchHandler isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    [(RCTSurfaceTouchHandler *)touchHandler detachFromView:view];
  }
}

@end
