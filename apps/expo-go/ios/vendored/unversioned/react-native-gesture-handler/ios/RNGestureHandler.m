#import "RNGestureHandler.h"
#import "RNManualActivationRecognizer.h"

#import "Handlers/RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <React/UIView+React.h>

@interface UIGestureRecognizer (GestureHandler)
@property (nonatomic, readonly) RNGestureHandler *gestureHandler;
@end

@implementation UIGestureRecognizer (GestureHandler)

- (RNGestureHandler *)gestureHandler
{
  id delegate = self.delegate;
  if ([delegate isKindOfClass:[RNGestureHandler class]]) {
    return (RNGestureHandler *)delegate;
  }
  return nil;
}

@end

typedef struct RNGHHitSlop {
  CGFloat top, left, bottom, right, width, height;
} RNGHHitSlop;

static RNGHHitSlop RNGHHitSlopEmpty = {NAN, NAN, NAN, NAN, NAN, NAN};

#define RNGH_HIT_SLOP_GET(key) (prop[key] == nil ? NAN : [prop[key] doubleValue])
#define RNGH_HIT_SLOP_IS_SET(hitSlop) \
  (!isnan(hitSlop.left) || !isnan(hitSlop.right) || !isnan(hitSlop.top) || !isnan(hitSlop.bottom))
#define RNGH_HIT_SLOP_INSET(key) (isnan(hitSlop.key) ? 0. : hitSlop.key)

CGRect RNGHHitSlopInsetRect(CGRect rect, RNGHHitSlop hitSlop)
{
  rect.origin.x -= RNGH_HIT_SLOP_INSET(left);
  rect.origin.y -= RNGH_HIT_SLOP_INSET(top);

  if (!isnan(hitSlop.width)) {
    if (!isnan(hitSlop.right)) {
      rect.origin.x = rect.size.width - hitSlop.width + RNGH_HIT_SLOP_INSET(right);
    }
    rect.size.width = hitSlop.width;
  } else {
    rect.size.width += (RNGH_HIT_SLOP_INSET(left) + RNGH_HIT_SLOP_INSET(right));
  }
  if (!isnan(hitSlop.height)) {
    if (!isnan(hitSlop.bottom)) {
      rect.origin.y = rect.size.height - hitSlop.height + RNGH_HIT_SLOP_INSET(bottom);
    }
    rect.size.height = hitSlop.height;
  } else {
    rect.size.height += (RNGH_HIT_SLOP_INSET(top) + RNGH_HIT_SLOP_INSET(bottom));
  }
  return rect;
}

static NSHashTable<RNGestureHandler *> *allGestureHandlers;

@implementation RNGestureHandler {
  RNGestureHandlerPointerTracker *_pointerTracker;
  RNGestureHandlerState _state;
  RNManualActivationRecognizer *_manualActivationRecognizer;
  NSArray<NSNumber *> *_handlersToWaitFor;
  NSArray<NSNumber *> *_handlersThatShouldWait;
  NSArray<NSNumber *> *_simultaneousHandlers;
  RNGHHitSlop _hitSlop;
  uint16_t _eventCoalescingKey;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super init])) {
    _pointerTracker = [[RNGestureHandlerPointerTracker alloc] initWithGestureHandler:self];
    _tag = tag;
    _lastState = RNGestureHandlerStateUndetermined;
    _hitSlop = RNGHHitSlopEmpty;
    _state = RNGestureHandlerStateBegan;
    _manualActivationRecognizer = nil;

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      allGestureHandlers = [NSHashTable weakObjectsHashTable];
    });

    [allGestureHandlers addObject:self];
  }
  return self;
}

- (void)resetConfig
{
  self.enabled = YES;
  self.manualActivation = NO;
  _shouldCancelWhenOutside = NO;
  _handlersToWaitFor = nil;
  _simultaneousHandlers = nil;
  _handlersThatShouldWait = nil;
  _hitSlop = RNGHHitSlopEmpty;
  _needsPointerData = NO;

  _recognizer.cancelsTouchesInView = YES;
}

- (void)configure:(NSDictionary *)config
{
  [self resetConfig];
  _handlersToWaitFor = [RCTConvert NSNumberArray:config[@"waitFor"]];
  _simultaneousHandlers = [RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];
  _handlersThatShouldWait = [RCTConvert NSNumberArray:config[@"blocksHandlers"]];

  id prop = config[@"enabled"];
  if (prop != nil) {
    self.enabled = [RCTConvert BOOL:prop];
  }

  prop = config[@"shouldCancelWhenOutside"];
  if (prop != nil) {
    _shouldCancelWhenOutside = [RCTConvert BOOL:prop];
  }

  prop = config[@"cancelsTouchesInView"];
  if (prop != nil) {
    _recognizer.cancelsTouchesInView = [RCTConvert BOOL:prop];
  }

  prop = config[@"needsPointerData"];
  if (prop != nil) {
    _needsPointerData = [RCTConvert BOOL:prop];
  }

  prop = config[@"manualActivation"];
  if (prop != nil) {
    self.manualActivation = [RCTConvert BOOL:prop];
  }

  prop = config[@"hitSlop"];
  if ([prop isKindOfClass:[NSNumber class]]) {
    _hitSlop.left = _hitSlop.right = _hitSlop.top = _hitSlop.bottom = [prop doubleValue];
  } else if (prop != nil) {
    _hitSlop.left = _hitSlop.right = RNGH_HIT_SLOP_GET(@"horizontal");
    _hitSlop.top = _hitSlop.bottom = RNGH_HIT_SLOP_GET(@"vertical");
    _hitSlop.left = RNGH_HIT_SLOP_GET(@"left");
    _hitSlop.right = RNGH_HIT_SLOP_GET(@"right");
    _hitSlop.top = RNGH_HIT_SLOP_GET(@"top");
    _hitSlop.bottom = RNGH_HIT_SLOP_GET(@"bottom");
    _hitSlop.width = RNGH_HIT_SLOP_GET(@"width");
    _hitSlop.height = RNGH_HIT_SLOP_GET(@"height");
    if (isnan(_hitSlop.left) && isnan(_hitSlop.right) && !isnan(_hitSlop.width)) {
      RCTLogError(@"When width is set one of left or right pads need to be defined");
    }
    if (!isnan(_hitSlop.width) && !isnan(_hitSlop.left) && !isnan(_hitSlop.right)) {
      RCTLogError(@"Cannot have all of left, right and width defined");
    }
    if (isnan(_hitSlop.top) && isnan(_hitSlop.bottom) && !isnan(_hitSlop.height)) {
      RCTLogError(@"When height is set one of top or bottom pads need to be defined");
    }
    if (!isnan(_hitSlop.height) && !isnan(_hitSlop.top) && !isnan(_hitSlop.bottom)) {
      RCTLogError(@"Cannot have all of top, bottom and height defined");
    }
  }
}

- (void)setEnabled:(BOOL)enabled
{
  _enabled = enabled;
  self.recognizer.enabled = enabled;
}

- (void)bindToView:(UIView *)view
{
  view.userInteractionEnabled = YES;
  self.recognizer.delegate = self;
  [view addGestureRecognizer:self.recognizer];

  [self bindManualActivationToView:view];
}

- (void)unbindFromView
{
  [self.recognizer.view removeGestureRecognizer:self.recognizer];
  self.recognizer.delegate = nil;

  [self unbindManualActivation];
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
  return [RNGestureHandlerEventExtraData forPosition:[recognizer locationInView:recognizer.view]
                                withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
                                 withNumberOfTouches:recognizer.numberOfTouches];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
  // it may happen that the gesture recognizer is reset after it's been unbound from the view,
  // it that recognizer tried to send event, the app would crash because the target of the event
  // would be nil.
  if (recognizer.view.reactTag == nil) {
    return;
  }

  _state = [self recognizerState];
  [self handleGesture:recognizer inState:_state];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer inState:(RNGestureHandlerState)state
{
  _state = state;
  RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
  [self sendEventsInState:self.state forViewWithTag:recognizer.view.reactTag withExtraData:eventData];
}

- (void)sendEventsInState:(RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)reactTag
            withExtraData:(RNGestureHandlerEventExtraData *)extraData
{
  if (state != _lastState) {
    // don't send change events from END to FAILED or CANCELLED, this may happen when gesture is ended in `onTouchesUp`
    // callback
    if (_lastState == RNGestureHandlerStateEnd &&
        (state == RNGestureHandlerStateFailed || state == RNGestureHandlerStateCancelled)) {
      return;
    }

    if (state == RNGestureHandlerStateActive) {
      // Generate a unique coalescing-key each time the gesture-handler becomes active. All events will have
      // the same coalescing-key allowing RCTEventDispatcher to coalesce RNGestureHandlerEvents when events are
      // generated faster than they can be treated by JS thread
      static uint16_t nextEventCoalescingKey = 0;
      self->_eventCoalescingKey = nextEventCoalescingKey++;

    } else if (state == RNGestureHandlerStateEnd && _lastState != RNGestureHandlerStateActive && !_manualActivation) {
      id event = [[RNGestureHandlerStateChange alloc] initWithReactTag:reactTag
                                                            handlerTag:_tag
                                                                 state:RNGestureHandlerStateActive
                                                             prevState:_lastState
                                                             extraData:extraData];
      [self sendEvent:event];
      _lastState = RNGestureHandlerStateActive;
    }
    id stateEvent = [[RNGestureHandlerStateChange alloc] initWithReactTag:reactTag
                                                               handlerTag:_tag
                                                                    state:state
                                                                prevState:_lastState
                                                                extraData:extraData];
    [self sendEvent:stateEvent];
    _lastState = state;
  }

  if (state == RNGestureHandlerStateActive) {
    id touchEvent = [[RNGestureHandlerEvent alloc] initWithReactTag:reactTag
                                                         handlerTag:_tag
                                                              state:state
                                                          extraData:extraData
                                                      coalescingKey:self->_eventCoalescingKey];
    [self sendEvent:touchEvent];
  }
}

- (void)sendEvent:(RNGestureHandlerStateChange *)event
{
  [self.emitter sendEvent:event withActionType:self.actionType];
}

- (void)sendTouchEventInState:(RNGestureHandlerState)state forViewWithTag:(NSNumber *)reactTag
{
  id extraData = [RNGestureHandlerEventExtraData forEventType:_pointerTracker.eventType
                                          withChangedPointers:_pointerTracker.changedPointersData
                                              withAllPointers:_pointerTracker.allPointersData
                                          withNumberOfTouches:_pointerTracker.trackedPointersCount];
  id event = [[RNGestureHandlerEvent alloc] initWithReactTag:reactTag
                                                  handlerTag:_tag
                                                       state:state
                                                   extraData:extraData
                                               coalescingKey:[_tag intValue]];

  [self.emitter sendEvent:event withActionType:self.actionType];
}

- (RNGestureHandlerState)recognizerState
{
  switch (_recognizer.state) {
    case UIGestureRecognizerStateBegan:
    case UIGestureRecognizerStatePossible:
      return RNGestureHandlerStateBegan;
    case UIGestureRecognizerStateEnded:
      return RNGestureHandlerStateEnd;
    case UIGestureRecognizerStateFailed:
      return RNGestureHandlerStateFailed;
    case UIGestureRecognizerStateCancelled:
      return RNGestureHandlerStateCancelled;
    case UIGestureRecognizerStateChanged:
      return RNGestureHandlerStateActive;
  }
  return RNGestureHandlerStateUndetermined;
}

- (RNGestureHandlerState)state
{
  // instead of mapping state of the recognizer directly, use value mapped when handleGesture was
  // called, making it correct while awaiting for another handler failure
  return _state;
}

#pragma mark Manual activation

- (void)stopActivationBlocker
{
  if (_manualActivationRecognizer != nil) {
    [_manualActivationRecognizer fail];
  }
}

- (void)setManualActivation:(BOOL)manualActivation
{
  _manualActivation = manualActivation;

  if (manualActivation) {
    _manualActivationRecognizer = [[RNManualActivationRecognizer alloc] initWithGestureHandler:self];

    if (_recognizer.view != nil) {
      [_recognizer.view addGestureRecognizer:_manualActivationRecognizer];
    }
  } else if (_manualActivationRecognizer != nil) {
    [_manualActivationRecognizer.view removeGestureRecognizer:_manualActivationRecognizer];
    _manualActivationRecognizer = nil;
  }
}

- (void)bindManualActivationToView:(UIView *)view
{
  if (_manualActivationRecognizer != nil) {
    [view addGestureRecognizer:_manualActivationRecognizer];
  }
}

- (void)unbindManualActivation
{
  if (_manualActivationRecognizer != nil) {
    [_manualActivationRecognizer.view removeGestureRecognizer:_manualActivationRecognizer];
  }
}

#pragma mark UIGestureRecognizerDelegate

+ (RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
{
  RNGestureHandler *handler = recognizer.gestureHandler;
  if (handler != nil) {
    return handler;
  }

  // We may try to extract "DummyGestureHandler" in case when "otherGestureRecognizer" belongs to
  // a native view being wrapped with "NativeViewGestureHandler"
  UIView *reactView = recognizer.view;
  while (reactView != nil && reactView.reactTag == nil) {
    reactView = reactView.superview;
  }

  for (UIGestureRecognizer *recognizer in reactView.gestureRecognizers) {
    if ([recognizer isKindOfClass:[RNDummyGestureRecognizer class]]) {
      return recognizer.gestureHandler;
    }
  }

  return nil;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  RNGestureHandler *handler = [RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
  if ([handler isKindOfClass:[RNNativeViewGestureHandler class]]) {
    for (NSNumber *handlerTag in handler->_handlersToWaitFor) {
      if ([_tag isEqual:handlerTag]) {
        return YES;
      }
    }
  }

  if (handler != nil) {
    for (NSNumber *handlerTag in _handlersThatShouldWait) {
      if ([handler.tag isEqual:handlerTag]) {
        return YES;
      }
    }
  }

  return NO;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  if ([_handlersToWaitFor count]) {
    RNGestureHandler *handler = [RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
    if (handler != nil) {
      for (NSNumber *handlerTag in _handlersToWaitFor) {
        if ([handler.tag isEqual:handlerTag]) {
          return YES;
        }
      }
    }
  }
  return NO;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
    shouldRecognizeSimultaneouslyWithGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  if (_recognizer.state == UIGestureRecognizerStateBegan && _recognizer.state == UIGestureRecognizerStatePossible) {
    return YES;
  }

  RNGestureHandler *handler = [RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
  if (handler != nil) {
    if ([_simultaneousHandlers count]) {
      for (NSNumber *handlerTag in _simultaneousHandlers) {
        if ([handler.tag isEqual:handlerTag]) {
          return YES;
        }
      }
    } else if (handler->_simultaneousHandlers) {
      for (NSNumber *handlerTag in handler->_simultaneousHandlers) {
        if ([self.tag isEqual:handlerTag]) {
          return YES;
        }
      }
    }
  }
  return NO;
}

- (void)reset
{
  // do not reset states while gesture is tracking pointers, as gestureRecognizerShouldBegin
  // might be called after some pointers are down, and after state manipulation by the user.
  // Pointer tracker calls this method when it resets, and in that case it no longer tracks
  // any pointers, thus entering this if
  if (!_needsPointerData || _pointerTracker.trackedPointersCount == 0) {
    _lastState = RNGestureHandlerStateUndetermined;
    _state = RNGestureHandlerStateBegan;
  }
}

- (BOOL)containsPointInView
{
  CGPoint pt = [_recognizer locationInView:_recognizer.view];
  CGRect hitFrame = RNGHHitSlopInsetRect(_recognizer.view.bounds, _hitSlop);
  return CGRectContainsPoint(hitFrame, pt);
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  if ([_handlersToWaitFor count]) {
    for (RNGestureHandler *handler in [allGestureHandlers allObjects]) {
      if (handler != nil &&
          (handler.state == RNGestureHandlerStateActive ||
           handler->_recognizer.state == UIGestureRecognizerStateBegan)) {
        for (NSNumber *handlerTag in _handlersToWaitFor) {
          if ([handler.tag isEqual:handlerTag]) {
            return NO;
          }
        }
      }
    }
  }

  [self reset];
  return YES;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer shouldReceiveTouch:(UITouch *)touch
{
  // If hitSlop is set we use it to determine if a given gesture recognizer should start processing
  // touch stream. This only works for negative values of hitSlop as this method won't be triggered
  // unless touch startes in the bounds of the attached view. To acheve similar effect with positive
  // values of hitSlop one should set hitSlop for the underlying view. This limitation is due to the
  // fact that hitTest method is only available at the level of UIView
  if (RNGH_HIT_SLOP_IS_SET(_hitSlop)) {
    CGPoint location = [touch locationInView:gestureRecognizer.view];
    CGRect hitFrame = RNGHHitSlopInsetRect(gestureRecognizer.view.bounds, _hitSlop);
    return CGRectContainsPoint(hitFrame, location);
  }
  return YES;
}

@end
