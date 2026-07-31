// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoUITouchHandlerHelper.h"
#import <ExpoModulesCore/Platform.h>
#import <React/RCTSurfaceTouchHandler.h>

// We put a custom RCTSurfaceTouchHandler in RNHostView. 
// The role of this handler is to dispatch touch events to JS so press handlers works.
// This is required for two reasons.
// 1. Touch events in a SwiftUI bottomsheet are not passed to JS as iOS mounts it in a separate window.
// 2. Touch events received by JS have wrong pageX and pageY as RNHostViews are positioned by SwiftUI instead of Yoga so Pressable events get cancelled.
//    pageX/pageY are anchored to the view the dispatching handler is attached to:
//    https://github.com/facebook/react-native/blob/v0.86.0/packages/react-native/React/Fabric/RCTSurfaceTouchHandler.mm#L60
// So we attach a custom touch handler and add `RootNodeKind` trait to RNHostView. This makes it behave like Modal in RN.
// We further customise the RCTSurfaceTouchHandler by overriding `canBePreventedByGestureRecognizer` to cancel the RN attached surface level touch handlers
// (the stock implementation defers to any recognizer outside its own subtree:
// https://github.com/facebook/react-native/blob/v0.86.0/packages/react-native/React/Fabric/RCTSurfaceTouchHandler.mm#L385).
// This is required as RNHostView can be put into a regular UIKit/SwiftUI hierarchy in same window so all the touch handlers can fire. 
// We don't want parent touch handlers to fire as they will carry wrong pageX/pageY.
// The same pattern is done for Android's RNHostView. There `onChildStartedNativeGesture` cancels the parent handlers.
// Here we also make sure that the parent handlers are activated again once the gesture is completed by this touch handler.
@interface ExpoUISurfaceTouchHandler : RCTSurfaceTouchHandler
@end

@implementation ExpoUISurfaceTouchHandler {
  // Ancestor handlers disabled while a gesture is in progress. Weak: the surface (or modal host)
  // owning them can unmount mid-gesture.
  NSHashTable<RCTSurfaceTouchHandler *> *_suppressedAncestorHandlers;
}

static BOOL ExpoUIAllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved || touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  if ([preventingGestureRecognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    return NO;
  }
  // The base class routes `shouldRequireFailureOfGestureRecognizer:` through this method, so
  // this also stops the handler from waiting for the surface root handler to fail.
  return [super canBePreventedByGestureRecognizer:preventingGestureRecognizer];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [self suppressAncestorTouchHandlers];
  [super touchesBegan:touches withEvent:event];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];

  if (ExpoUIAllTouchesAreCancelledOrEnded(event.allTouches)) {
    [self unsuppressAncestorTouchHandlers];
  }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];

  if (ExpoUIAllTouchesAreCancelledOrEnded(event.allTouches)) {
    [self unsuppressAncestorTouchHandlers];
  }
}

- (void)reset
{
  [super reset];
  [self unsuppressAncestorTouchHandlers];
}

- (void)detachFromView:(UIView *)view
{
  // The host can unmount mid-gesture; don't leave the surface root handler disabled.
  [self unsuppressAncestorTouchHandlers];
  [super detachFromView:view];
}

- (void)dealloc
{
  [self unsuppressAncestorTouchHandlers];
}

- (void)suppressAncestorTouchHandlers
{
  if (_suppressedAncestorHandlers.count > 0) {
    return;
  }
  if (_suppressedAncestorHandlers == nil) {
    _suppressedAncestorHandlers = [NSHashTable weakObjectsHashTable];
  }
  // Disable every RN surface handler above us (the surface root's, a modal host's, and any
  // enclosing `RNHostView`'s) so none of them dispatches a parallel surface-coordinate stream.
  for (UIView *ancestor = self.view.superview; ancestor != nil; ancestor = ancestor.superview) {
    for (UIGestureRecognizer *recognizer in ancestor.gestureRecognizers) {
      if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]] && recognizer.enabled) {
        recognizer.enabled = NO;
        [_suppressedAncestorHandlers addObject:(RCTSurfaceTouchHandler *)recognizer];
      }
    }
  }
}

- (void)unsuppressAncestorTouchHandlers
{
  for (RCTSurfaceTouchHandler *handler in _suppressedAncestorHandlers) {
    handler.enabled = YES;
  }
  [_suppressedAncestorHandlers removeAllObjects];
}

@end

@implementation ExpoUITouchHandlerHelper

+ (nullable UIGestureRecognizer *)createAndAttachTouchHandlerForView:(UIView *)view {
  for (UIGestureRecognizer *recognizer in [view.gestureRecognizers copy]) {
    if ([recognizer isKindOfClass:[RCTSurfaceTouchHandler class]]) {
      return nil;
    }
  }
  RCTSurfaceTouchHandler *touchHandler = [[ExpoUISurfaceTouchHandler alloc] init];
  [touchHandler attachToView:view];
  return touchHandler;
}

+ (void)detachTouchHandler:(UIGestureRecognizer *)touchHandler fromView:(UIView *)view {
  if ([touchHandler isKindOfClass:[RCTSurfaceTouchHandler class]]) {
    [(RCTSurfaceTouchHandler *)touchHandler detachFromView:view];
  }
}

@end
