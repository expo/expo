// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoUITouchHandlerHelper.h"
#import <ExpoModulesCore/Platform.h>
#import <React/RCTSurfaceTouchHandler.h>

@implementation ExpoUITouchHandlerHelper

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view {
  for (UIGestureRecognizer *recognizer in [view.gestureRecognizers copy]) {
    if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
      return nil;
    }
  }
  RCTSurfaceTouchHandler *touchHandler = [[RCTSurfaceTouchHandler alloc] init];
  [touchHandler attachToView:view];
  return touchHandler;
}

+ (BOOL)isReactTouchHandler:(UIGestureRecognizer *)recognizer {
  if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    return YES;
  }
  // Paper's RCTTouchHandler header may be absent in Fabric-only builds, so resolve the
  // class at runtime (cached) rather than referencing it at compile time.
  static Class paperTouchHandlerClass;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    paperTouchHandlerClass = NSClassFromString(@"RCTTouchHandler");
  });
  return paperTouchHandlerClass != nil && [recognizer isKindOfClass:paperTouchHandlerClass];
}

@end
