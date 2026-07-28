// Copyright 2015-present 650 Industries. All rights reserved.

#import "ExpoUITouchHandlerHelper.h"
#import <ExpoModulesCore/Platform.h>
#import <React/RCTSurfaceTouchHandler.h>

/**
 Touch handler for React Native content hosted inside SwiftUI (`RNHostView`).

 `RCTSurfaceTouchHandler` defers to any recognizer that is not on its descendants, so a stock
 instance attached to the hosted content loses the gesture to the surface root's touch handler
 and only the initial `touchStart` is dispatched with host-relative coordinates — every move
 arrives from the root handler in surface coordinates. The JS responder compares those moves
 against a `measure()`d region in the host's coordinate space (see the `layoutRoot` prop), so
 any finger movement cancels the press.

 This subclass takes ownership of touches that begin in the hosted subtree: it does not defer
 to ancestor `RCTSurfaceTouchHandler`s and disables them for the duration of the gesture, so
 the only stream that reaches JS is the host-relative one. Recognizers other than RN's own
 surface handlers (e.g. SwiftUI scroll view pans) still win the gesture like they do for any
 other RN content, which is what cancels a press when the user starts scrolling.
 */
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
