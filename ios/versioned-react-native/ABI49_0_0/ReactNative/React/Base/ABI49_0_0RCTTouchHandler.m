/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTTouchHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "ABI49_0_0RCTAssert.h"
#import "ABI49_0_0RCTBridge.h"
#import "ABI49_0_0RCTEventDispatcherProtocol.h"
#import "ABI49_0_0RCTLog.h"
#import "ABI49_0_0RCTSurfaceView.h"
#import "ABI49_0_0RCTTouchEvent.h"
#import "ABI49_0_0RCTUIManager.h"
#import "ABI49_0_0RCTUtils.h"
#import "ABI49_0_0UIView+React.h"

@interface ABI49_0_0RCTTouchHandler () <UIGestureRecognizerDelegate>
@end

// TODO: this class behaves a lot like a module, and could be implemented as a
// module if we were to assume that modules and RootViews had a 1:1 relationship
@implementation ABI49_0_0RCTTouchHandler {
  __weak id<ABI49_0_0RCTEventDispatcherProtocol> _eventDispatcher;

  /**
   * Arrays managed in parallel tracking native touch object along with the
   * native view that was touched, and the ABI49_0_0React touch data dictionary.
   * These must be kept track of because `UIKit` destroys the touch targets
   * if touches are canceled, and we have no other way to recover this info.
   */
  NSMutableOrderedSet<UITouch *> *_nativeTouches;
  NSMutableArray<NSMutableDictionary *> *_ABI49_0_0ReactTouches;
  NSMutableArray<UIView *> *_touchViews;

  __weak UIView *_cachedRootView;

  uint16_t _coalescingKey;
}

- (instancetype)initWithBridge:(ABI49_0_0RCTBridge *)bridge
{
  ABI49_0_0RCTAssertParam(bridge);

  if ((self = [super initWithTarget:nil action:NULL])) {
    _eventDispatcher = bridge.eventDispatcher;

    _nativeTouches = [NSMutableOrderedSet new];
    _ABI49_0_0ReactTouches = [NSMutableArray new];
    _touchViews = [NSMutableArray new];

    // `cancelsTouchesInView` and `delaysTouches*` are needed in order to be used as a top level
    // event delegated recognizer. Otherwise, lower-level components not built
    // using ABI49_0_0RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO; // This is default value.
    self.delaysTouchesEnded = NO;

    self.delegate = self;
  }

  return self;
}

ABI49_0_0RCT_NOT_IMPLEMENTED(-(instancetype)initWithTarget : (id)target action : (SEL)action)

- (void)attachToView:(UIView *)view
{
  ABI49_0_0RCTAssert(self.view == nil, @"ABI49_0_0RCTTouchHandler already has attached view.");

  [view addGestureRecognizer:self];
}

- (void)detachFromView:(UIView *)view
{
  ABI49_0_0RCTAssertParam(view);
  ABI49_0_0RCTAssert(self.view == view, @"ABI49_0_0RCTTouchHandler attached to another view.");

  [view removeGestureRecognizer:self];
}

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    ABI49_0_0RCTAssert(![_nativeTouches containsObject:touch], @"Touch is already recorded. This is a critical bug.");

    // Find closest ABI49_0_0React-managed touchable view
    UIView *targetView = touch.view;
    while (targetView) {
      if (targetView.ABI49_0_0ReactTag && targetView.userInteractionEnabled) {
        break;
      }
      targetView = targetView.superview;
    }

    NSNumber *ABI49_0_0ReactTag = [targetView ABI49_0_0ReactTagAtPoint:[touch locationInView:targetView]];
    if (!ABI49_0_0ReactTag || !targetView.userInteractionEnabled) {
      continue;
    }

    // Get new, unique touch identifier for the ABI49_0_0React touch
    const NSUInteger ABI49_0_0RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_ABI49_0_0ReactTouches.lastObject[@"identifier"] integerValue] + 1) % ABI49_0_0RCTMaxTouches;
    for (NSDictionary *ABI49_0_0ReactTouch in _ABI49_0_0ReactTouches) {
      NSInteger usedID = [ABI49_0_0ReactTouch[@"identifier"] integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID++;
      } else if (usedID > touchID) {
        // If usedID > touchID, touchID must be unique, so we can stop looking
        break;
      }
    }

    // Create touch
    NSMutableDictionary *ABI49_0_0ReactTouch = [[NSMutableDictionary alloc] initWithCapacity:ABI49_0_0RCTMaxTouches];
    ABI49_0_0ReactTouch[@"target"] = ABI49_0_0ReactTag;
    ABI49_0_0ReactTouch[@"identifier"] = @(touchID);

    // Add to arrays
    [_touchViews addObject:targetView];
    [_nativeTouches addObject:touch];
    [_ABI49_0_0ReactTouches addObject:ABI49_0_0ReactTouch];
  }
}

- (void)_recordRemovedTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    NSUInteger index = [_nativeTouches indexOfObject:touch];
    if (index == NSNotFound) {
      continue;
    }

    [_touchViews removeObjectAtIndex:index];
    [_nativeTouches removeObjectAtIndex:index];
    [_ABI49_0_0ReactTouches removeObjectAtIndex:index];
  }
}

- (void)_updateABI49_0_0ReactTouchAtIndex:(NSInteger)touchIndex
{
  UITouch *nativeTouch = _nativeTouches[touchIndex];
  CGPoint windowLocation = [nativeTouch locationInView:nativeTouch.window];
  ABI49_0_0RCTAssert(_cachedRootView, @"We were unable to find a root view for the touch");
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:_cachedRootView];

  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];

  NSMutableDictionary *ABI49_0_0ReactTouch = _ABI49_0_0ReactTouches[touchIndex];
  ABI49_0_0ReactTouch[@"pageX"] = @(ABI49_0_0RCTSanitizeNaNValue(rootViewLocation.x, @"touchEvent.pageX"));
  ABI49_0_0ReactTouch[@"pageY"] = @(ABI49_0_0RCTSanitizeNaNValue(rootViewLocation.y, @"touchEvent.pageY"));
  ABI49_0_0ReactTouch[@"locationX"] = @(ABI49_0_0RCTSanitizeNaNValue(touchViewLocation.x, @"touchEvent.locationX"));
  ABI49_0_0ReactTouch[@"locationY"] = @(ABI49_0_0RCTSanitizeNaNValue(touchViewLocation.y, @"touchEvent.locationY"));
  ABI49_0_0ReactTouch[@"timestamp"] = @(nativeTouch.timestamp * 1000); // in ms, for JS

  // TODO: force for a 'normal' touch is usually 1.0;
  // should we expose a `normalTouchForce` constant somewhere (which would
  // have a value of `1.0 / nativeTouch.maximumPossibleForce`)?
  if (ABI49_0_0RCTForceTouchAvailable()) {
    ABI49_0_0ReactTouch[@"force"] = @(ABI49_0_0RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
  } else if (nativeTouch.type == UITouchTypePencil) {
    ABI49_0_0ReactTouch[@"force"] = @(ABI49_0_0RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
    ABI49_0_0ReactTouch[@"altitudeAngle"] = @(ABI49_0_0RCTZeroIfNaN(nativeTouch.altitudeAngle));
  }
}

/**
 * Constructs information about touch events to send across the serialized
 * boundary. This data should be compliant with W3C `Touch` objects. This data
 * alone isn't sufficient to construct W3C `Event` objects. To construct that,
 * there must be a simple receiver on the other side of the bridge that
 * organizes the touch objects into `Event`s.
 *
 * We send the data as an array of `Touch`es, the type of action
 * (start/end/move/cancel) and the indices that represent "changed" `Touch`es
 * from that array.
 */
- (void)_updateAndDispatchTouches:(NSSet<UITouch *> *)touches eventName:(NSString *)eventName
{
  // Update touches
  NSMutableArray<NSNumber *> *changedIndexes = [NSMutableArray new];
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
    if (index == NSNotFound) {
      continue;
    }

    [self _updateABI49_0_0ReactTouchAtIndex:index];
    [changedIndexes addObject:@(index)];
  }

  if (changedIndexes.count == 0) {
    return;
  }

  // Deep copy the touches because they will be accessed from another thread
  // TODO: would it be safer to do this in the bridge or executor, rather than trusting caller?
  NSMutableArray<NSDictionary *> *ABI49_0_0ReactTouches = [[NSMutableArray alloc] initWithCapacity:_ABI49_0_0ReactTouches.count];
  for (NSDictionary *touch in _ABI49_0_0ReactTouches) {
    [ABI49_0_0ReactTouches addObject:[touch copy]];
  }

  BOOL canBeCoalesced = [eventName isEqualToString:@"touchMove"];

  // We increment `_coalescingKey` twice here just for sure that
  // this `_coalescingKey` will not be reused by another (preceding or following) event
  // (yes, even if coalescing only happens (and makes sense) on events of the same type).

  if (!canBeCoalesced) {
    _coalescingKey++;
  }

  ABI49_0_0RCTTouchEvent *event = [[ABI49_0_0RCTTouchEvent alloc] initWithEventName:eventName
                                                         ABI49_0_0ReactTag:self.view.ABI49_0_0ReactTag
                                                     ABI49_0_0ReactTouches:ABI49_0_0ReactTouches
                                                   changedIndexes:changedIndexes
                                                    coalescingKey:_coalescingKey];

  if (!canBeCoalesced) {
    _coalescingKey++;
  }

  [_eventDispatcher sendEvent:event];
}

/***
 * To ensure compatibility when using UIManager.measure and ABI49_0_0RCTTouchHandler, we have to adopt
 * UIManager.measure's behavior in finding a "root view".
 * Usually ABI49_0_0RCTTouchHandler is already attached to a root view but in some cases (e.g. Modal),
 * we are instead attached to some ABI49_0_0RCTView subtree. This is also the case when embedding some ABI49_0_0RN
 * views inside a separate ViewController not controlled by ABI49_0_0RN.
 * This logic will either find the nearest rootView, or go all the way to the UIWindow.
 * While this is not optimal, it is exactly what UIManager.measure does, and what Touchable.js
 * relies on.
 * We cache it here so that we don't have to repeat it for every touch in the gesture.
 */
- (void)_cacheRootView
{
  UIView *rootView = self.view;
  while (rootView.superview && ![rootView isABI49_0_0ReactRootView] && ![rootView isKindOfClass:[ABI49_0_0RCTSurfaceView class]]) {
    rootView = rootView.superview;
  }
  _cachedRootView = rootView;
}

#pragma mark - Gesture Recognizer Delegate Callbacks

static BOOL ABI49_0_0RCTAllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved || touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL ABI49_0_0RCTAnyTouchesChanged(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan || touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

#pragma mark - `UIResponder`-ish touch-delivery methods

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];

  [self _cacheRootView];

  // "start" has to record new touches *before* extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];

  [self _updateAndDispatchTouches:touches eventName:@"touchStart"];

  if (self.state == UIGestureRecognizerStatePossible) {
    self.state = UIGestureRecognizerStateBegan;
  } else if (self.state == UIGestureRecognizerStateBegan) {
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];

  [self _updateAndDispatchTouches:touches eventName:@"touchMove"];
  self.state = UIGestureRecognizerStateChanged;
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];

  [self _updateAndDispatchTouches:touches eventName:@"touchEnd"];

  if (ABI49_0_0RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateEnded;
  } else if (ABI49_0_0RCTAnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }

  [self _recordRemovedTouches:touches];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];

  [self _updateAndDispatchTouches:touches eventName:@"touchCancel"];

  if (ABI49_0_0RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
    self.state = UIGestureRecognizerStateCancelled;
  } else if (ABI49_0_0RCTAnyTouchesChanged(event.allTouches)) {
    self.state = UIGestureRecognizerStateChanged;
  }

  [self _recordRemovedTouches:touches];
}

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  // We fail in favour of other external gesture recognizers.
  // iOS will ask `delegate`'s opinion about this gesture recognizer little bit later.
  return ![preventingGestureRecognizer.view isDescendantOfView:self.view];
}

- (void)reset
{
  if (_nativeTouches.count != 0) {
    [self _updateAndDispatchTouches:_nativeTouches.set eventName:@"touchCancel"];

    [_nativeTouches removeAllObjects];
    [_ABI49_0_0ReactTouches removeAllObjects];
    [_touchViews removeAllObjects];

    _cachedRootView = nil;
  }
}

#pragma mark - Other

- (void)cancel
{
  self.enabled = NO;
  self.enabled = YES;
}

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(__unused UIGestureRecognizer *)gestureRecognizer
    shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  // Same condition for `failure of` as for `be prevented by`.
  return [self canBePreventedByGestureRecognizer:otherGestureRecognizer];
}

@end
