/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTTouchHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import "ABI10_0_0RCTAssert.h"
#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTEventDispatcher.h"
#import "ABI10_0_0RCTLog.h"
#import "ABI10_0_0RCTTouchEvent.h"
#import "ABI10_0_0RCTUIManager.h"
#import "ABI10_0_0RCTUtils.h"
#import "UIView+ReactABI10_0_0.h"

// TODO: this class behaves a lot like a module, and could be implemented as a
// module if we were to assume that modules and RootViews had a 1:1 relationship
@implementation ABI10_0_0RCTTouchHandler
{
  __weak ABI10_0_0RCTEventDispatcher *_eventDispatcher;

  /**
   * Arrays managed in parallel tracking native touch object along with the
   * native view that was touched, and the ReactABI10_0_0 touch data dictionary.
   * These must be kept track of because `UIKit` destroys the touch targets
   * if touches are canceled, and we have no other way to recover this info.
   */
  NSMutableOrderedSet<UITouch *> *_nativeTouches;
  NSMutableArray<NSMutableDictionary *> *_ReactABI10_0_0Touches;
  NSMutableArray<UIView *> *_touchViews;

  BOOL _dispatchedInitialTouches;
  BOOL _recordingInteractionTiming;
  CFTimeInterval _mostRecentEnqueueJS;
  uint16_t _coalescingKey;
}

- (instancetype)initWithBridge:(ABI10_0_0RCTBridge *)bridge
{
  ABI10_0_0RCTAssertParam(bridge);

  if ((self = [super initWithTarget:self action:@selector(handleGestureUpdate:)])) {

    _eventDispatcher = [bridge moduleForClass:[ABI10_0_0RCTEventDispatcher class]];
    _dispatchedInitialTouches = NO;
    _nativeTouches = [NSMutableOrderedSet new];
    _ReactABI10_0_0Touches = [NSMutableArray new];
    _touchViews = [NSMutableArray new];

    // `cancelsTouchesInView` is needed in order to be used as a top level
    // event delegated recognizer. Otherwise, lower-level components not built
    // using ABI10_0_0RCT, will fail to recognize gestures.
    self.cancelsTouchesInView = NO;
  }
  return self;
}

ABI10_0_0RCT_NOT_IMPLEMENTED(- (instancetype)initWithTarget:(id)target action:(SEL)action)

typedef NS_ENUM(NSInteger, ABI10_0_0RCTTouchEventType) {
  ABI10_0_0RCTTouchEventTypeStart,
  ABI10_0_0RCTTouchEventTypeMove,
  ABI10_0_0RCTTouchEventTypeEnd,
  ABI10_0_0RCTTouchEventTypeCancel
};

#pragma mark - Bookkeeping for touch indices

- (void)_recordNewTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {

    ABI10_0_0RCTAssert(![_nativeTouches containsObject:touch],
              @"Touch is already recorded. This is a critical bug.");

    // Find closest ReactABI10_0_0-managed touchable view
    UIView *targetView = touch.view;
    while (targetView) {
      if (targetView.ReactABI10_0_0Tag && targetView.userInteractionEnabled &&
          [targetView ReactABI10_0_0RespondsToTouch:touch]) {
        break;
      }
      targetView = targetView.superview;
    }

    NSNumber *ReactABI10_0_0Tag = [targetView ReactABI10_0_0TagAtPoint:[touch locationInView:targetView]];
    if (!ReactABI10_0_0Tag || !targetView.userInteractionEnabled) {
      return;
    }

    // Get new, unique touch identifier for the ReactABI10_0_0 touch
    const NSUInteger ABI10_0_0RCTMaxTouches = 11; // This is the maximum supported by iDevices
    NSInteger touchID = ([_ReactABI10_0_0Touches.lastObject[@"identifier"] integerValue] + 1) % ABI10_0_0RCTMaxTouches;
    for (NSDictionary *ReactABI10_0_0Touch in _ReactABI10_0_0Touches) {
      NSInteger usedID = [ReactABI10_0_0Touch[@"identifier"] integerValue];
      if (usedID == touchID) {
        // ID has already been used, try next value
        touchID ++;
      } else if (usedID > touchID) {
        // If usedID > touchID, touchID must be unique, so we can stop looking
        break;
      }
    }

    // Create touch
    NSMutableDictionary *ReactABI10_0_0Touch = [[NSMutableDictionary alloc] initWithCapacity:ABI10_0_0RCTMaxTouches];
    ReactABI10_0_0Touch[@"target"] = ReactABI10_0_0Tag;
    ReactABI10_0_0Touch[@"identifier"] = @(touchID);

    // Add to arrays
    [_touchViews addObject:targetView];
    [_nativeTouches addObject:touch];
    [_ReactABI10_0_0Touches addObject:ReactABI10_0_0Touch];
  }
}

- (void)_recordRemovedTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    NSUInteger index = [_nativeTouches indexOfObject:touch];
    if(index == NSNotFound) {
      continue;
    }

    [_touchViews removeObjectAtIndex:index];
    [_nativeTouches removeObjectAtIndex:index];
    [_ReactABI10_0_0Touches removeObjectAtIndex:index];
  }
}

- (void)_updateReactABI10_0_0TouchAtIndex:(NSInteger)touchIndex
{
  UITouch *nativeTouch = _nativeTouches[touchIndex];
  CGPoint windowLocation = [nativeTouch locationInView:nativeTouch.window];
  CGPoint rootViewLocation = [nativeTouch.window convertPoint:windowLocation toView:self.view];

  UIView *touchView = _touchViews[touchIndex];
  CGPoint touchViewLocation = [nativeTouch.window convertPoint:windowLocation toView:touchView];

  NSMutableDictionary *ReactABI10_0_0Touch = _ReactABI10_0_0Touches[touchIndex];
  ReactABI10_0_0Touch[@"pageX"] = @(rootViewLocation.x);
  ReactABI10_0_0Touch[@"pageY"] = @(rootViewLocation.y);
  ReactABI10_0_0Touch[@"locationX"] = @(touchViewLocation.x);
  ReactABI10_0_0Touch[@"locationY"] = @(touchViewLocation.y);
  ReactABI10_0_0Touch[@"timestamp"] =  @(nativeTouch.timestamp * 1000); // in ms, for JS

  // TODO: force for a 'normal' touch is usually 1.0;
  // should we expose a `normalTouchForce` constant somewhere (which would
  // have a value of `1.0 / nativeTouch.maximumPossibleForce`)?
  if (ABI10_0_0RCTForceTouchAvailable()) {
    ReactABI10_0_0Touch[@"force"] = @(ABI10_0_0RCTZeroIfNaN(nativeTouch.force / nativeTouch.maximumPossibleForce));
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
- (void)_updateAndDispatchTouches:(NSSet<UITouch *> *)touches
                        eventName:(NSString *)eventName
                  originatingTime:(__unused CFTimeInterval)originatingTime
{
  // Update touches
  NSMutableArray<NSNumber *> *changedIndexes = [NSMutableArray new];
  for (UITouch *touch in touches) {
    NSInteger index = [_nativeTouches indexOfObject:touch];
    if (index == NSNotFound) {
      continue;
    }

    [self _updateReactABI10_0_0TouchAtIndex:index];
    [changedIndexes addObject:@(index)];
  }

  if (changedIndexes.count == 0) {
    return;
  }

  // Deep copy the touches because they will be accessed from another thread
  // TODO: would it be safer to do this in the bridge or executor, rather than trusting caller?
  NSMutableArray<NSDictionary *> *ReactABI10_0_0Touches =
    [[NSMutableArray alloc] initWithCapacity:_ReactABI10_0_0Touches.count];
  for (NSDictionary *touch in _ReactABI10_0_0Touches) {
    [ReactABI10_0_0Touches addObject:[touch copy]];
  }

  ABI10_0_0RCTTouchEvent *event = [[ABI10_0_0RCTTouchEvent alloc] initWithEventName:eventName
                                                     ReactABI10_0_0Touches:ReactABI10_0_0Touches
                                                   changedIndexes:changedIndexes
                                                    coalescingKey:_coalescingKey];
  [_eventDispatcher sendEvent:event];
}

#pragma mark - Gesture Recognizer Delegate Callbacks

static BOOL ABI10_0_0RCTAllTouchesAreCancelledOrEnded(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved ||
        touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

static BOOL ABI10_0_0RCTAnyTouchesChanged(NSSet<UITouch *> *touches)
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

- (void)handleGestureUpdate:(__unused UIGestureRecognizer *)gesture
{
  // If gesture just recognized, send all touches to JS as if they just began.
  if (self.state == UIGestureRecognizerStateBegan) {
    [self _updateAndDispatchTouches:_nativeTouches.set eventName:@"topTouchStart" originatingTime:0];

    // We store this flag separately from `state` because after a gesture is
    // recognized, its `state` changes immediately but its action (this
    // method) isn't fired until dependent gesture recognizers have failed. We
    // only want to send move/end/cancel touches if we've sent the touchStart.
    _dispatchedInitialTouches = YES;
  }

  // For the other states, we could dispatch the updates here but since we
  // specifically send info about which touches changed, it's simpler to
  // dispatch the updates from the raw touch methods below.
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];

  _coalescingKey++;
  // "start" has to record new touches before extracting the event.
  // "end"/"cancel" needs to remove the touch *after* extracting the event.
  [self _recordNewTouches:touches];
  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchStart" originatingTime:event.timestamp];
    self.state = UIGestureRecognizerStateChanged;
  } else {
    self.state = UIGestureRecognizerStateBegan;
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];

  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchMove" originatingTime:event.timestamp];
    self.state = UIGestureRecognizerStateChanged;
  }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];

  _coalescingKey++;
  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchEnd" originatingTime:event.timestamp];

    if (ABI10_0_0RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
      self.state = UIGestureRecognizerStateEnded;
    } else if (ABI10_0_0RCTAnyTouchesChanged(event.allTouches)) {
      self.state = UIGestureRecognizerStateChanged;
    }
  }
  [self _recordRemovedTouches:touches];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];

  _coalescingKey++;
  if (_dispatchedInitialTouches) {
    [self _updateAndDispatchTouches:touches eventName:@"touchCancel" originatingTime:event.timestamp];

    if (ABI10_0_0RCTAllTouchesAreCancelledOrEnded(event.allTouches)) {
      self.state = UIGestureRecognizerStateCancelled;
    } else if (ABI10_0_0RCTAnyTouchesChanged(event.allTouches)) {
      self.state = UIGestureRecognizerStateChanged;
    }
  }
  [self _recordRemovedTouches:touches];
}

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(__unused UIGestureRecognizer *)preventingGestureRecognizer
{
  return NO;
}

- (void)reset
{
  _dispatchedInitialTouches = NO;
}

- (void)cancel
{
  self.enabled = NO;
  self.enabled = YES;
}

@end
