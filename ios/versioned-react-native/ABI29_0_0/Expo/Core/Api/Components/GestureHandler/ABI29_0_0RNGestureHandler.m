#import "ABI29_0_0RNGestureHandler.h"

#import "Handlers/ABI29_0_0RNNativeViewHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ReactABI29_0_0/UIView+ReactABI29_0_0.h>

@interface UIGestureRecognizer (GestureHandler)
@property (nonatomic, readonly) ABI29_0_0RNGestureHandler *gestureHandler;
@end


@implementation UIGestureRecognizer (GestureHandler)

- (ABI29_0_0RNGestureHandler *)gestureHandler
{
    id delegate = self.delegate;
    if ([delegate isKindOfClass:[ABI29_0_0RNGestureHandler class]]) {
        return (ABI29_0_0RNGestureHandler *)delegate;
    }
    return nil;
}

@end

typedef struct ABI29_0_0RNGHHitSlop {
    CGFloat top, left, bottom, right, width, height;
} ABI29_0_0RNGHHitSlop;

static ABI29_0_0RNGHHitSlop ABI29_0_0RNGHHitSlopEmpty = { NAN, NAN, NAN, NAN, NAN, NAN };

#define ABI29_0_0RNGH_HIT_SLOP_GET(key) (prop[key] == nil ? NAN : [prop[key] doubleValue])
#define ABI29_0_0RNGH_HIT_SLOP_IS_SET(hitSlop) (!isnan(hitSlop.left) || !isnan(hitSlop.right) || \
                                        !isnan(hitSlop.top) || !isnan(hitSlop.bottom))
#define ABI29_0_0RNGH_HIT_SLOP_INSET(key) (isnan(hitSlop.key) ? 0. : hitSlop.key)

CGRect ABI29_0_0RNGHHitSlopInsetRect(CGRect rect, ABI29_0_0RNGHHitSlop hitSlop) {
    rect.origin.x -= ABI29_0_0RNGH_HIT_SLOP_INSET(left);
    rect.origin.y -= ABI29_0_0RNGH_HIT_SLOP_INSET(top);

    if (!isnan(hitSlop.width)) {
        if (!isnan(hitSlop.left)) {
            rect.origin.x = rect.size.width - hitSlop.width + ABI29_0_0RNGH_HIT_SLOP_INSET(right);
        }
        rect.size.width = hitSlop.width;
    } else {
        rect.size.width += (ABI29_0_0RNGH_HIT_SLOP_INSET(left) + ABI29_0_0RNGH_HIT_SLOP_INSET(right));
    }
    if (!isnan(hitSlop.height)) {
        if (!isnan(hitSlop.top)) {
            rect.origin.y = rect.size.height - hitSlop.height + ABI29_0_0RNGH_HIT_SLOP_INSET(bottom);
        }
        rect.size.height = hitSlop.height;
    } else {
        rect.size.height += (ABI29_0_0RNGH_HIT_SLOP_INSET(top) + ABI29_0_0RNGH_HIT_SLOP_INSET(bottom));
    }
    return rect;
}


@implementation ABI29_0_0RNGestureHandler {
    NSArray<NSNumber *> *_handlersToWaitFor;
    NSArray<NSNumber *> *_simultaneousHandlers;
    ABI29_0_0RNGHHitSlop _hitSlop;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super init])) {
        _tag = tag;
        _lastState = ABI29_0_0RNGestureHandlerStateUndetermined;
        _hitSlop = ABI29_0_0RNGHHitSlopEmpty;
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    _handlersToWaitFor = [ABI29_0_0RCTConvert NSNumberArray:config[@"waitFor"]];
    _simultaneousHandlers = [ABI29_0_0RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];

    id prop = config[@"enabled"];
    if (prop != nil) {
        self.enabled = [ABI29_0_0RCTConvert BOOL:prop];
    } else {
        self.enabled = YES;
    }

    prop = config[@"shouldCancelWhenOutside"];
    if (prop != nil) {
        _shouldCancelWhenOutside = [ABI29_0_0RCTConvert BOOL:prop];
    } else {
        _shouldCancelWhenOutside = NO;
    }

    prop = config[@"hitSlop"];
    if ([prop isKindOfClass:[NSNumber class]]) {
        _hitSlop.left = _hitSlop.right = _hitSlop.top = _hitSlop.bottom = [prop doubleValue];
    } else if (prop != nil) {
        _hitSlop.left = _hitSlop.right = ABI29_0_0RNGH_HIT_SLOP_GET(@"horizontal");
        _hitSlop.top = _hitSlop.bottom = ABI29_0_0RNGH_HIT_SLOP_GET(@"vertical");
        _hitSlop.left = ABI29_0_0RNGH_HIT_SLOP_GET(@"left");
        _hitSlop.right = ABI29_0_0RNGH_HIT_SLOP_GET(@"right");
        _hitSlop.top = ABI29_0_0RNGH_HIT_SLOP_GET(@"top");
        _hitSlop.bottom = ABI29_0_0RNGH_HIT_SLOP_GET(@"bottom");
        _hitSlop.width = ABI29_0_0RNGH_HIT_SLOP_GET(@"width");
        _hitSlop.height = ABI29_0_0RNGH_HIT_SLOP_GET(@"height");
        if (isnan(_hitSlop.left) && isnan(_hitSlop.right) && !isnan(_hitSlop.width)) {
            ABI29_0_0RCTLogError(@"When width is set one of left or right pads need to be defined");
        }
        if (!isnan(_hitSlop.width) && !isnan(_hitSlop.left) && !isnan(_hitSlop.right)) {
            ABI29_0_0RCTLogError(@"Cannot have all of left, right and width defined");
        }
        if (isnan(_hitSlop.top) && isnan(_hitSlop.bottom) && !isnan(_hitSlop.height)) {
            ABI29_0_0RCTLogError(@"When height is set one of top or bottom pads need to be defined");
        }
        if (!isnan(_hitSlop.height) && !isnan(_hitSlop.top) && !isnan(_hitSlop.bottom)) {
            ABI29_0_0RCTLogError(@"Cannot have all of top, bottom and height defined");
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

- (ABI29_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
    return [ABI29_0_0RNGestureHandlerEventExtraData
            forPosition:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
            withNumberOfTouches:recognizer.numberOfTouches];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
    ABI29_0_0RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
    [self sendEventsInState:self.state forViewWithTag:recognizer.view.ReactABI29_0_0Tag withExtraData:eventData];
}

- (void)sendEventsInState:(ABI29_0_0RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)ReactABI29_0_0Tag
            withExtraData:(ABI29_0_0RNGestureHandlerEventExtraData *)extraData
{
    id touchEvent = [[ABI29_0_0RNGestureHandlerEvent alloc] initWithRactTag:ReactABI29_0_0Tag
                                                        handlerTag:_tag
                                                             state:state
                                                         extraData:extraData];

    if (state != _lastState) {
        if (state == ABI29_0_0RNGestureHandlerStateEnd && _lastState != ABI29_0_0RNGestureHandlerStateActive) {
            [self.emitter sendStateChangeEvent:[[ABI29_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI29_0_0Tag
                                                                                         handlerTag:_tag
                                                                                              state:ABI29_0_0RNGestureHandlerStateActive
                                                                                          prevState:_lastState
                                                                                          extraData:extraData]];
            _lastState = ABI29_0_0RNGestureHandlerStateActive;
        }
        id stateEvent = [[ABI29_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI29_0_0Tag
                                                                  handlerTag:_tag
                                                                       state:state
                                                                   prevState:_lastState
                                                                   extraData:extraData];
        [self.emitter sendStateChangeEvent:stateEvent];
        _lastState = state;
    }

    if (state == ABI29_0_0RNGestureHandlerStateActive) {
        [self.emitter sendTouchEvent:touchEvent];
    }
}

- (ABI29_0_0RNGestureHandlerState)state
{
    switch (_recognizer.state) {
        case UIGestureRecognizerStateBegan:
        case UIGestureRecognizerStatePossible:
            return ABI29_0_0RNGestureHandlerStateBegan;
        case UIGestureRecognizerStateEnded:
            return ABI29_0_0RNGestureHandlerStateEnd;
        case UIGestureRecognizerStateFailed:
            return ABI29_0_0RNGestureHandlerStateFailed;
        case UIGestureRecognizerStateCancelled:
            return ABI29_0_0RNGestureHandlerStateCancelled;
        case UIGestureRecognizerStateChanged:
            return ABI29_0_0RNGestureHandlerStateActive;
    }
    return ABI29_0_0RNGestureHandlerStateUndetermined;
}

#pragma mark UIGestureRecognizerDelegate

+ (ABI29_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
{
    ABI29_0_0RNGestureHandler *handler = recognizer.gestureHandler;
    if (handler != nil) {
        return handler;
    }

    // We may try to extract "DummyGestureHandler" in case when "otherGestureRecognizer" belongs to
    // a native view being wrapped with "NativeViewGestureHandler"
    UIView *ReactABI29_0_0View = recognizer.view;
    while (ReactABI29_0_0View != nil && ReactABI29_0_0View.ReactABI29_0_0Tag == nil) {
        ReactABI29_0_0View = ReactABI29_0_0View.superview;
    }

    for (UIGestureRecognizer *recognizer in ReactABI29_0_0View.gestureRecognizers) {
        if ([recognizer isKindOfClass:[ABI29_0_0RNDummyGestureRecognizer class]]) {
            return recognizer.gestureHandler;
        }
    }

    return nil;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    ABI29_0_0RNGestureHandler *handler = [ABI29_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
    if ([handler isKindOfClass:[ABI29_0_0RNNativeViewGestureHandler class]]) {
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
        ABI29_0_0RNGestureHandler *handler = [ABI29_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
        ABI29_0_0RNGestureHandler *handler = [ABI29_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
    _lastState = ABI29_0_0RNGestureHandlerStateUndetermined;
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
    if (ABI29_0_0RNGH_HIT_SLOP_IS_SET(_hitSlop)) {
        CGPoint location = [touch locationInView:gestureRecognizer.view];
        CGRect hitFrame = ABI29_0_0RNGHHitSlopInsetRect(gestureRecognizer.view.bounds, _hitSlop);
        return CGRectContainsPoint(hitFrame, location);
    }
    return YES;
}

@end
