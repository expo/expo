// Copyright 2024-present 650 Industries. All rights reserved.

#import "RCTTouchHandlerHelper.h"

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTSurfaceTouchHandler.h>
#endif

@implementation RCTTouchHandlerHelper

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view {
#ifdef RCT_NEW_ARCH_ENABLED
  for (UIGestureRecognizer *recognizer in [view.gestureRecognizers copy]) {
    if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
      return nil;
    }
  }

  RCTSurfaceTouchHandler *touchHandler = [[RCTSurfaceTouchHandler alloc] init];
  [touchHandler attachToView:view];
  return touchHandler;
#else
  return nil;
#endif
}

+ (void)detachTouchHandler:(UIGestureRecognizer *)touchHandler fromView:(UIView *)view {
#ifdef RCT_NEW_ARCH_ENABLED
  if ([touchHandler isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    [(RCTSurfaceTouchHandler *)touchHandler detachFromView:view];
  }
#endif
}

@end
