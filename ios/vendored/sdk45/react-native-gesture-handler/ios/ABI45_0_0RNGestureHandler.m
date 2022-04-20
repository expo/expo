#import "ABI45_0_0RNGestureHandler.h"
#import "ABI45_0_0RNManualActivationRecognizer.h"

#import "Handlers/ABI45_0_0RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ABI45_0_0React/ABI45_0_0UIView+React.h>

@interface UIGestureRecognizer (GestureHandler)
@property (nonatomic, readonly) ABI45_0_0RNGestureHandler *gestureHandler;
@end


@implementation UIGestureRecognizer (GestureHandler)

- (ABI45_0_0RNGestureHandler *)gestureHandler
{
    id delegate = self.delegate;
    if ([delegate isKindOfClass:[ABI45_0_0RNGestureHandler class]]) {
        return (ABI45_0_0RNGestureHandler *)delegate;
    }
    return nil;
}

@end

typedef struct ABI45_0_0RNGHHitSlop {
    CGFloat top, left, bottom, right, width, height;
} ABI45_0_0RNGHHitSlop;

static ABI45_0_0RNGHHitSlop ABI45_0_0RNGHHitSlopEmpty = { NAN, NAN, NAN, NAN, NAN, NAN };

#define ABI45_0_0RNGH_HIT_SLOP_GET(key) (prop[key] == nil ? NAN : [prop[key] doubleValue])
#define ABI45_0_0RNGH_HIT_SLOP_IS_SET(hitSlop) (!isnan(hitSlop.left) || !isnan(hitSlop.right) || \
                                        !isnan(hitSlop.top) || !isnan(hitSlop.bottom))
#define ABI45_0_0RNGH_HIT_SLOP_INSET(key) (isnan(hitSlop.key) ? 0. : hitSlop.key)

CGRect ABI45_0_0RNGHHitSlopInsetRect(CGRect rect, ABI45_0_0RNGHHitSlop hitSlop) {
    rect.origin.x -= ABI45_0_0RNGH_HIT_SLOP_INSET(left);
    rect.origin.y -= ABI45_0_0RNGH_HIT_SLOP_INSET(top);

    if (!isnan(hitSlop.width)) {
        if (!isnan(hitSlop.right)) {
            rect.origin.x = rect.size.width - hitSlop.width + ABI45_0_0RNGH_HIT_SLOP_INSET(right);
        }
        rect.size.width = hitSlop.width;
    } else {
        rect.size.width += (ABI45_0_0RNGH_HIT_SLOP_INSET(left) + ABI45_0_0RNGH_HIT_SLOP_INSET(right));
    }
    if (!isnan(hitSlop.height)) {
        if (!isnan(hitSlop.bottom)) {
            rect.origin.y = rect.size.height - hitSlop.height + ABI45_0_0RNGH_HIT_SLOP_INSET(bottom);
        }
        rect.size.height = hitSlop.height;
    } else {
        rect.size.height += (ABI45_0_0RNGH_HIT_SLOP_INSET(top) + ABI45_0_0RNGH_HIT_SLOP_INSET(bottom));
    }
    return rect;
}

static NSHashTable<ABI45_0_0RNGestureHandler *> *allGestureHandlers;

@implementation ABI45_0_0RNGestureHandler {
    ABI45_0_0RNGestureHandlerPointerTracker *_pointerTracker;
    ABI45_0_0RNGestureHandlerState _state;
    ABI45_0_0RNManualActivationRecognizer *_manualActivationRecognizer;
    NSArray<NSNumber *> *_handlersToWaitFor;
    NSArray<NSNumber *> *_simultaneousHandlers;
    ABI45_0_0RNGHHitSlop _hitSlop;
    uint16_t _eventCoalescingKey;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super init])) {
        _pointerTracker = [[ABI45_0_0RNGestureHandlerPointerTracker alloc] initWithGestureHandler:self];
        _tag = tag;
        _lastState = ABI45_0_0RNGestureHandlerStateUndetermined;
        _hitSlop = ABI45_0_0RNGHHitSlopEmpty;
        _state = ABI45_0_0RNGestureHandlerStateBegan;
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
  _shouldCancelWhenOutside = NO;
  _handlersToWaitFor = nil;
  _simultaneousHandlers = nil;
  _hitSlop = ABI45_0_0RNGHHitSlopEmpty;
  _needsPointerData = NO;
  
  self.manualActivation = NO;
}

- (void)configure:(NSDictionary *)config
{
  [self resetConfig];
    _handlersToWaitFor = [ABI45_0_0RCTConvert NSNumberArray:config[@"waitFor"]];
    _simultaneousHandlers = [ABI45_0_0RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];

    id prop = config[@"enabled"];
    if (prop != nil) {
        self.enabled = [ABI45_0_0RCTConvert BOOL:prop];
    }

    prop = config[@"shouldCancelWhenOutside"];
    if (prop != nil) {
        _shouldCancelWhenOutside = [ABI45_0_0RCTConvert BOOL:prop];
    }
  
    prop = config[@"needsPointerData"];
    if (prop != nil) {
        _needsPointerData = [ABI45_0_0RCTConvert BOOL:prop];
    }
    
    prop = config[@"manualActivation"];
    if (prop != nil) {
        self.manualActivation = [ABI45_0_0RCTConvert BOOL:prop];
    }

    prop = config[@"hitSlop"];
    if ([prop isKindOfClass:[NSNumber class]]) {
        _hitSlop.left = _hitSlop.right = _hitSlop.top = _hitSlop.bottom = [prop doubleValue];
    } else if (prop != nil) {
        _hitSlop.left = _hitSlop.right = ABI45_0_0RNGH_HIT_SLOP_GET(@"horizontal");
        _hitSlop.top = _hitSlop.bottom = ABI45_0_0RNGH_HIT_SLOP_GET(@"vertical");
        _hitSlop.left = ABI45_0_0RNGH_HIT_SLOP_GET(@"left");
        _hitSlop.right = ABI45_0_0RNGH_HIT_SLOP_GET(@"right");
        _hitSlop.top = ABI45_0_0RNGH_HIT_SLOP_GET(@"top");
        _hitSlop.bottom = ABI45_0_0RNGH_HIT_SLOP_GET(@"bottom");
        _hitSlop.width = ABI45_0_0RNGH_HIT_SLOP_GET(@"width");
        _hitSlop.height = ABI45_0_0RNGH_HIT_SLOP_GET(@"height");
        if (isnan(_hitSlop.left) && isnan(_hitSlop.right) && !isnan(_hitSlop.width)) {
            ABI45_0_0RCTLogError(@"When width is set one of left or right pads need to be defined");
        }
        if (!isnan(_hitSlop.width) && !isnan(_hitSlop.left) && !isnan(_hitSlop.right)) {
            ABI45_0_0RCTLogError(@"Cannot have all of left, right and width defined");
        }
        if (isnan(_hitSlop.top) && isnan(_hitSlop.bottom) && !isnan(_hitSlop.height)) {
            ABI45_0_0RCTLogError(@"When height is set one of top or bottom pads need to be defined");
        }
        if (!isnan(_hitSlop.height) && !isnan(_hitSlop.top) && !isnan(_hitSlop.bottom)) {
            ABI45_0_0RCTLogError(@"Cannot have all of top, bottom and height defined");
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

- (ABI45_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
    return [ABI45_0_0RNGestureHandlerEventExtraData
            forPosition:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
            withNumberOfTouches:recognizer.numberOfTouches];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
    _state = [self recognizerState];
    ABI45_0_0RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
    [self sendEventsInState:self.state forViewWithTag:recognizer.view.ABI45_0_0ReactTag withExtraData:eventData];
}

- (void)sendEventsInState:(ABI45_0_0RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)ABI45_0_0ReactTag
            withExtraData:(ABI45_0_0RNGestureHandlerEventExtraData *)extraData
{
    if (state != _lastState) {
        if (state == ABI45_0_0RNGestureHandlerStateActive) {
            // Generate a unique coalescing-key each time the gesture-handler becomes active. All events will have
            // the same coalescing-key allowing ABI45_0_0RCTEventDispatcher to coalesce ABI45_0_0RNGestureHandlerEvents when events are
            // generated faster than they can be treated by JS thread
            static uint16_t nextEventCoalescingKey = 0;
            self->_eventCoalescingKey = nextEventCoalescingKey++;

        } else if (state == ABI45_0_0RNGestureHandlerStateEnd && _lastState != ABI45_0_0RNGestureHandlerStateActive) {
            id event = [[ABI45_0_0RNGestureHandlerStateChange alloc] initWithABI45_0_0ReactTag:ABI45_0_0ReactTag
                                                                  handlerTag:_tag
                                                                       state:ABI45_0_0RNGestureHandlerStateActive
                                                                   prevState:_lastState
                                                                   extraData:extraData];
            [self sendStateChangeEvent:event];
            _lastState = ABI45_0_0RNGestureHandlerStateActive;
        }
        id stateEvent = [[ABI45_0_0RNGestureHandlerStateChange alloc] initWithABI45_0_0ReactTag:ABI45_0_0ReactTag
                                                                   handlerTag:_tag
                                                                        state:state
                                                                    prevState:_lastState
                                                                    extraData:extraData];
        [self sendStateChangeEvent:stateEvent];
        _lastState = state;
    }

    if (state == ABI45_0_0RNGestureHandlerStateActive) {
        id touchEvent = [[ABI45_0_0RNGestureHandlerEvent alloc] initWithABI45_0_0ReactTag:ABI45_0_0ReactTag
                                                             handlerTag:_tag
                                                                  state:state
                                                              extraData:extraData
                                                          coalescingKey:self->_eventCoalescingKey];
        [self sendStateChangeEvent:touchEvent];
    }
}

- (void)sendStateChangeEvent:(ABI45_0_0RNGestureHandlerStateChange *)event
{
    if (self.usesDeviceEvents) {
        [self.emitter sendStateChangeDeviceEvent:event];
    } else {
        [self.emitter sendStateChangeEvent:event];
    }
}

- (void)sendTouchEventInState:(ABI45_0_0RNGestureHandlerState)state
                 forViewWithTag:(NSNumber *)ABI45_0_0ReactTag
{
  id extraData = [ABI45_0_0RNGestureHandlerEventExtraData forEventType:_pointerTracker.eventType
                                          withChangedPointers:_pointerTracker.changedPointersData
                                              withAllPointers:_pointerTracker.allPointersData
                                          withNumberOfTouches:_pointerTracker.trackedPointersCount];
  id event = [[ABI45_0_0RNGestureHandlerEvent alloc] initWithABI45_0_0ReactTag:ABI45_0_0ReactTag handlerTag:_tag state:state extraData:extraData coalescingKey:[_tag intValue]];
  
  if (self.usesDeviceEvents) {
      [self.emitter sendStateChangeDeviceEvent:event];
  } else {
      [self.emitter sendStateChangeEvent:event];
  }
}

- (ABI45_0_0RNGestureHandlerState)recognizerState
{
    switch (_recognizer.state) {
        case UIGestureRecognizerStateBegan:
        case UIGestureRecognizerStatePossible:
            return ABI45_0_0RNGestureHandlerStateBegan;
        case UIGestureRecognizerStateEnded:
            return ABI45_0_0RNGestureHandlerStateEnd;
        case UIGestureRecognizerStateFailed:
            return ABI45_0_0RNGestureHandlerStateFailed;
        case UIGestureRecognizerStateCancelled:
            return ABI45_0_0RNGestureHandlerStateCancelled;
        case UIGestureRecognizerStateChanged:
            return ABI45_0_0RNGestureHandlerStateActive;
    }
    return ABI45_0_0RNGestureHandlerStateUndetermined;
}

- (ABI45_0_0RNGestureHandlerState)state
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
    _manualActivationRecognizer = [[ABI45_0_0RNManualActivationRecognizer alloc] initWithGestureHandler:self];

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

+ (ABI45_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
{
    ABI45_0_0RNGestureHandler *handler = recognizer.gestureHandler;
    if (handler != nil) {
        return handler;
    }

    // We may try to extract "DummyGestureHandler" in case when "otherGestureRecognizer" belongs to
    // a native view being wrapped with "NativeViewGestureHandler"
    UIView *reactView = recognizer.view;
    while (reactView != nil && reactView.ABI45_0_0ReactTag == nil) {
        reactView = reactView.superview;
    }

    for (UIGestureRecognizer *recognizer in reactView.gestureRecognizers) {
        if ([recognizer isKindOfClass:[ABI45_0_0RNDummyGestureRecognizer class]]) {
            return recognizer.gestureHandler;
        }
    }

    return nil;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    ABI45_0_0RNGestureHandler *handler = [ABI45_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
    if ([handler isKindOfClass:[ABI45_0_0RNNativeViewGestureHandler class]]) {
        for (NSNumber *handlerTag in handler->_handlersToWaitFor) {
            if ([_tag isEqual:handlerTag]) {
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
        ABI45_0_0RNGestureHandler *handler = [ABI45_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
    if ([_simultaneousHandlers count]) {
        ABI45_0_0RNGestureHandler *handler = [ABI45_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
        if (handler != nil) {
            for (NSNumber *handlerTag in _simultaneousHandlers) {
                if ([handler.tag isEqual:handlerTag]) {
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
        _lastState = ABI45_0_0RNGestureHandlerStateUndetermined;
        _state = ABI45_0_0RNGestureHandlerStateBegan;
    }
}

 - (BOOL)containsPointInView
 {
     CGPoint pt = [_recognizer locationInView:_recognizer.view];
     CGRect hitFrame = ABI45_0_0RNGHHitSlopInsetRect(_recognizer.view.bounds, _hitSlop);
     return CGRectContainsPoint(hitFrame, pt);
 }

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
    if ([_handlersToWaitFor count]) {
        for (ABI45_0_0RNGestureHandler *handler in [allGestureHandlers allObjects]) {
            if (handler != nil
                && (handler.state == ABI45_0_0RNGestureHandlerStateActive || handler->_recognizer.state == UIGestureRecognizerStateBegan)) {
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
    if (ABI45_0_0RNGH_HIT_SLOP_IS_SET(_hitSlop)) {
        CGPoint location = [touch locationInView:gestureRecognizer.view];
        CGRect hitFrame = ABI45_0_0RNGHHitSlopInsetRect(gestureRecognizer.view.bounds, _hitSlop);
        return CGRectContainsPoint(hitFrame, location);
    }
    return YES;
}

@end
