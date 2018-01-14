#import "ABI25_0_0RNGestureHandler.h"

#import "Handlers/ABI25_0_0RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ReactABI25_0_0/UIView+ReactABI25_0_0.h>

@interface UIGestureRecognizer (GestureHandler)
@property (nonatomic, readonly) ABI25_0_0RNGestureHandler *gestureHandler;
@end


@implementation UIGestureRecognizer (GestureHandler)

- (ABI25_0_0RNGestureHandler *)gestureHandler
{
    id delegate = self.delegate;
    if ([delegate isKindOfClass:[ABI25_0_0RNGestureHandler class]]) {
        return (ABI25_0_0RNGestureHandler *)delegate;
    }
    return nil;
}

@end


@implementation ABI25_0_0RNGestureHandler {
    NSArray<NSNumber *> *_handlersToWaitFor;
    NSArray<NSNumber *> *_simultaniousHandlers;
    UIEdgeInsets _hitSlopEdgeInsets;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super init])) {
        _tag = tag;
        _lastState = ABI25_0_0RNGestureHandlerStateUndetermined;
        _hitSlopEdgeInsets = UIEdgeInsetsZero;
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    _handlersToWaitFor = [ABI25_0_0RCTConvert NSNumberArray:config[@"waitFor"]];
    _simultaniousHandlers = [ABI25_0_0RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];

    id prop = config[@"enabled"];
    if (prop != nil) {
        self.enabled = [ABI25_0_0RCTConvert BOOL:prop];
    } else {
        self.enabled = YES;
    }

    prop = config[@"shouldCancelWhenOutside"];
    if (prop != nil) {
        _shouldCancelWhenOutside = [ABI25_0_0RCTConvert BOOL:prop];
    } else {
        _shouldCancelWhenOutside = NO;
    }

    prop = config[@"hitSlop"];
    if (prop != nil) {
         UIEdgeInsets insets = [ABI25_0_0RCTConvert UIEdgeInsets:prop];
        _hitSlopEdgeInsets = UIEdgeInsetsMake(-insets.top, -insets.left, -insets.bottom, -insets.right);
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
}

- (void)unbindFromView
{
    [self.recognizer.view removeGestureRecognizer:self.recognizer];
    self.recognizer.delegate = nil;
}

- (ABI25_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
    return [ABI25_0_0RNGestureHandlerEventExtraData
            forPosition:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
    ABI25_0_0RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
    [self sendEventsInState:self.state forViewWithTag:recognizer.view.ReactABI25_0_0Tag withExtraData:eventData];
}

- (void)sendEventsInState:(ABI25_0_0RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)ReactABI25_0_0Tag
            withExtraData:(ABI25_0_0RNGestureHandlerEventExtraData *)extraData
{
    id touchEvent = [[ABI25_0_0RNGestureHandlerEvent alloc] initWithRactTag:ReactABI25_0_0Tag
                                                        handlerTag:_tag
                                                             state:state
                                                         extraData:extraData];

    if (state != _lastState) {
        if (state == ABI25_0_0RNGestureHandlerStateEnd && _lastState != ABI25_0_0RNGestureHandlerStateActive) {
            [self.emitter sendStateChangeEvent:[[ABI25_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI25_0_0Tag
                                                                                         handlerTag:_tag
                                                                                              state:ABI25_0_0RNGestureHandlerStateActive
                                                                                          prevState:_lastState
                                                                                          extraData:extraData]];
            _lastState = ABI25_0_0RNGestureHandlerStateActive;
        }
        id stateEvent = [[ABI25_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI25_0_0Tag
                                                                  handlerTag:_tag
                                                                       state:state
                                                                   prevState:_lastState
                                                                   extraData:extraData];
        [self.emitter sendStateChangeEvent:stateEvent];
        _lastState = state;
    }

    if (state == ABI25_0_0RNGestureHandlerStateActive) {
        [self.emitter sendTouchEvent:touchEvent];
    }
}

- (ABI25_0_0RNGestureHandlerState)state
{
    switch (_recognizer.state) {
        case UIGestureRecognizerStateBegan:
        case UIGestureRecognizerStatePossible:
            return ABI25_0_0RNGestureHandlerStateBegan;
        case UIGestureRecognizerStateEnded:
            return ABI25_0_0RNGestureHandlerStateEnd;
        case UIGestureRecognizerStateFailed:
            return ABI25_0_0RNGestureHandlerStateFailed;
        case UIGestureRecognizerStateCancelled:
            return ABI25_0_0RNGestureHandlerStateCancelled;
        case UIGestureRecognizerStateChanged:
            return ABI25_0_0RNGestureHandlerStateActive;
    }
    return ABI25_0_0RNGestureHandlerStateUndetermined;
}

#pragma mark UIGestureRecognizerDelegate

+ (ABI25_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
{
    ABI25_0_0RNGestureHandler *handler = recognizer.gestureHandler;
    if (handler != nil) {
        return handler;
    }

    // We may try to extract "DummyGestureHandler" in case when "otherGestureRecognizer" belongs to
    // a native view being wrapped with "NativeViewGestureHandler"
    UIView *ReactABI25_0_0View = recognizer.view;
    while (ReactABI25_0_0View != nil && ReactABI25_0_0View.ReactABI25_0_0Tag == nil) {
        ReactABI25_0_0View = ReactABI25_0_0View.superview;
    }

    for (UIGestureRecognizer *recognizer in ReactABI25_0_0View.gestureRecognizers) {
        if ([recognizer isKindOfClass:[ABI25_0_0RNDummyGestureRecognizer class]]) {
            return recognizer.gestureHandler;
        }
    }

    return nil;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    ABI25_0_0RNGestureHandler *handler = [ABI25_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
    if ([handler isKindOfClass:[ABI25_0_0RNNativeViewGestureHandler class]]) {
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
        ABI25_0_0RNGestureHandler *handler = [ABI25_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
    if ([_simultaniousHandlers count]) {
        ABI25_0_0RNGestureHandler *handler = [ABI25_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
        if (handler != nil) {
            for (NSNumber *handlerTag in _simultaniousHandlers) {
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
    _lastState = ABI25_0_0RNGestureHandlerStateUndetermined;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
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
    if (!UIEdgeInsetsEqualToEdgeInsets(_hitSlopEdgeInsets, UIEdgeInsetsZero)) {
        CGPoint location = [touch locationInView:gestureRecognizer.view];
        CGRect hitFrame = UIEdgeInsetsInsetRect(gestureRecognizer.view.bounds, _hitSlopEdgeInsets);
        return CGRectContainsPoint(hitFrame, location);
    }
    return YES;
}

@end
