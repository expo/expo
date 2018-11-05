#import "ABI28_0_0RNGestureHandler.h"

#import "ABI28_0_0RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ReactABI28_0_0/UIView+ReactABI28_0_0.h>

@interface UIGestureRecognizer (ABI28_0_0GestureHandler)
@property (nonatomic, readonly) ABI28_0_0RNGestureHandler *gestureHandler;
@end


@implementation UIGestureRecognizer (ABI28_0_0GestureHandler)

- (ABI28_0_0RNGestureHandler *)gestureHandler
{
    id delegate = self.delegate;
    if ([delegate isKindOfClass:[ABI28_0_0RNGestureHandler class]]) {
        return (ABI28_0_0RNGestureHandler *)delegate;
    }
    return nil;
}

@end

typedef struct ABI28_0_0RNGHHitSlop {
    CGFloat top, left, bottom, right, width, height;
} ABI28_0_0RNGHHitSlop;

static ABI28_0_0RNGHHitSlop ABI28_0_0RNGHHitSlopEmpty = { NAN, NAN, NAN, NAN, NAN, NAN };

#define ABI28_0_0RNGH_HIT_SLOP_GET(key) (prop[key] == nil ? NAN : [prop[key] doubleValue])
#define ABI28_0_0RNGH_HIT_SLOP_IS_SET(hitSlop) (!isnan(hitSlop.left) || !isnan(hitSlop.right) || \
                                        !isnan(hitSlop.top) || !isnan(hitSlop.bottom))
#define ABI28_0_0RNGH_HIT_SLOP_INSET(key) (isnan(hitSlop.key) ? 0. : hitSlop.key)

CGRect ABI28_0_0RNGHHitSlopInsetRect(CGRect rect, ABI28_0_0RNGHHitSlop hitSlop) {
    rect.origin.x -= ABI28_0_0RNGH_HIT_SLOP_INSET(left);
    rect.origin.y -= ABI28_0_0RNGH_HIT_SLOP_INSET(top);

    if (!isnan(hitSlop.width)) {
        if (!isnan(hitSlop.left)) {
            rect.origin.x = rect.size.width - hitSlop.width + ABI28_0_0RNGH_HIT_SLOP_INSET(right);
        }
        rect.size.width = hitSlop.width;
    } else {
        rect.size.width += (ABI28_0_0RNGH_HIT_SLOP_INSET(left) + ABI28_0_0RNGH_HIT_SLOP_INSET(right));
    }
    if (!isnan(hitSlop.height)) {
        if (!isnan(hitSlop.top)) {
            rect.origin.y = rect.size.height - hitSlop.height + ABI28_0_0RNGH_HIT_SLOP_INSET(bottom);
        }
        rect.size.height = hitSlop.height;
    } else {
        rect.size.height += (ABI28_0_0RNGH_HIT_SLOP_INSET(top) + ABI28_0_0RNGH_HIT_SLOP_INSET(bottom));
    }
    return rect;
}


@implementation ABI28_0_0RNGestureHandler {
    NSArray<NSNumber *> *_handlersToWaitFor;
    NSArray<NSNumber *> *_simultaniousHandlers;
    ABI28_0_0RNGHHitSlop _hitSlop;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super init])) {
        _tag = tag;
        _lastState = ABI28_0_0RNGestureHandlerStateUndetermined;
        _hitSlop = ABI28_0_0RNGHHitSlopEmpty;
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    _handlersToWaitFor = [ABI28_0_0RCTConvert NSNumberArray:config[@"waitFor"]];
    _simultaniousHandlers = [ABI28_0_0RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];

    id prop = config[@"enabled"];
    if (prop != nil) {
        self.enabled = [ABI28_0_0RCTConvert BOOL:prop];
    } else {
        self.enabled = YES;
    }

    prop = config[@"shouldCancelWhenOutside"];
    if (prop != nil) {
        _shouldCancelWhenOutside = [ABI28_0_0RCTConvert BOOL:prop];
    } else {
        _shouldCancelWhenOutside = NO;
    }

    prop = config[@"hitSlop"];
    if ([prop isKindOfClass:[NSNumber class]]) {
        _hitSlop.left = _hitSlop.right = _hitSlop.top = _hitSlop.bottom = [prop doubleValue];
    } else if (prop != nil) {
        _hitSlop.left = _hitSlop.right = ABI28_0_0RNGH_HIT_SLOP_GET(@"horizontal");
        _hitSlop.top = _hitSlop.bottom = ABI28_0_0RNGH_HIT_SLOP_GET(@"vertical");
        _hitSlop.left = ABI28_0_0RNGH_HIT_SLOP_GET(@"left");
        _hitSlop.right = ABI28_0_0RNGH_HIT_SLOP_GET(@"right");
        _hitSlop.top = ABI28_0_0RNGH_HIT_SLOP_GET(@"top");
        _hitSlop.bottom = ABI28_0_0RNGH_HIT_SLOP_GET(@"bottom");
        _hitSlop.width = ABI28_0_0RNGH_HIT_SLOP_GET(@"width");
        _hitSlop.height = ABI28_0_0RNGH_HIT_SLOP_GET(@"height");
        if (isnan(_hitSlop.left) && isnan(_hitSlop.right) && !isnan(_hitSlop.width)) {
            ABI28_0_0RCTLogError(@"When width is set one of left or right pads need to be defined");
        }
        if (!isnan(_hitSlop.width) && !isnan(_hitSlop.left) && !isnan(_hitSlop.right)) {
            ABI28_0_0RCTLogError(@"Cannot have all of left, right and width defined");
        }
        if (isnan(_hitSlop.top) && isnan(_hitSlop.bottom) && !isnan(_hitSlop.height)) {
            ABI28_0_0RCTLogError(@"When height is set one of top or bottom pads need to be defined");
        }
        if (!isnan(_hitSlop.height) && !isnan(_hitSlop.top) && !isnan(_hitSlop.bottom)) {
            ABI28_0_0RCTLogError(@"Cannot have all of top, bottom and height defined");
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
}

- (void)unbindFromView
{
    [self.recognizer.view removeGestureRecognizer:self.recognizer];
    self.recognizer.delegate = nil;
}

- (ABI28_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
    return [ABI28_0_0RNGestureHandlerEventExtraData
            forPosition:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
            withNumberOfTouches:recognizer.numberOfTouches];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
    ABI28_0_0RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
    [self sendEventsInState:self.state forViewWithTag:recognizer.view.ReactABI28_0_0Tag withExtraData:eventData];
}

- (void)sendEventsInState:(ABI28_0_0RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)ReactABI28_0_0Tag
            withExtraData:(ABI28_0_0RNGestureHandlerEventExtraData *)extraData
{
    id touchEvent = [[ABI28_0_0RNGestureHandlerEvent alloc] initWithRactTag:ReactABI28_0_0Tag
                                                        handlerTag:_tag
                                                             state:state
                                                         extraData:extraData];

    if (state != _lastState) {
        if (state == ABI28_0_0RNGestureHandlerStateEnd && _lastState != ABI28_0_0RNGestureHandlerStateActive) {
            [self.emitter sendStateChangeEvent:[[ABI28_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI28_0_0Tag
                                                                                         handlerTag:_tag
                                                                                              state:ABI28_0_0RNGestureHandlerStateActive
                                                                                          prevState:_lastState
                                                                                          extraData:extraData]];
            _lastState = ABI28_0_0RNGestureHandlerStateActive;
        }
        id stateEvent = [[ABI28_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI28_0_0Tag
                                                                  handlerTag:_tag
                                                                       state:state
                                                                   prevState:_lastState
                                                                   extraData:extraData];
        [self.emitter sendStateChangeEvent:stateEvent];
        _lastState = state;
    }

    if (state == ABI28_0_0RNGestureHandlerStateActive) {
        [self.emitter sendTouchEvent:touchEvent];
    }
}

- (ABI28_0_0RNGestureHandlerState)state
{
    switch (_recognizer.state) {
        case UIGestureRecognizerStateBegan:
        case UIGestureRecognizerStatePossible:
            return ABI28_0_0RNGestureHandlerStateBegan;
        case UIGestureRecognizerStateEnded:
            return ABI28_0_0RNGestureHandlerStateEnd;
        case UIGestureRecognizerStateFailed:
            return ABI28_0_0RNGestureHandlerStateFailed;
        case UIGestureRecognizerStateCancelled:
            return ABI28_0_0RNGestureHandlerStateCancelled;
        case UIGestureRecognizerStateChanged:
            return ABI28_0_0RNGestureHandlerStateActive;
    }
    return ABI28_0_0RNGestureHandlerStateUndetermined;
}

#pragma mark UIGestureRecognizerDelegate

+ (ABI28_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
{
    ABI28_0_0RNGestureHandler *handler = recognizer.gestureHandler;
    if (handler != nil) {
        return handler;
    }

    // We may try to extract "DummyGestureHandler" in case when "otherGestureRecognizer" belongs to
    // a native view being wrapped with "NativeViewGestureHandler"
    UIView *ReactABI28_0_0View = recognizer.view;
    while (ReactABI28_0_0View != nil && ReactABI28_0_0View.ReactABI28_0_0Tag == nil) {
        ReactABI28_0_0View = ReactABI28_0_0View.superview;
    }

    for (UIGestureRecognizer *recognizer in ReactABI28_0_0View.gestureRecognizers) {
        if ([recognizer isKindOfClass:[ABI28_0_0RNDummyGestureRecognizer class]]) {
            return recognizer.gestureHandler;
        }
    }

    return nil;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    ABI28_0_0RNGestureHandler *handler = [ABI28_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
    if ([handler isKindOfClass:[ABI28_0_0RNNativeViewGestureHandler class]]) {
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
        ABI28_0_0RNGestureHandler *handler = [ABI28_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
        ABI28_0_0RNGestureHandler *handler = [ABI28_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
    _lastState = ABI28_0_0RNGestureHandlerStateUndetermined;
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
    if (ABI28_0_0RNGH_HIT_SLOP_IS_SET(_hitSlop)) {
        CGPoint location = [touch locationInView:gestureRecognizer.view];
        CGRect hitFrame = ABI28_0_0RNGHHitSlopInsetRect(gestureRecognizer.view.bounds, _hitSlop);
        return CGRectContainsPoint(hitFrame, location);
    }
    return YES;
}

@end
