#import "ABI23_0_0RNGestureHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import <ReactABI23_0_0/ABI23_0_0RCTConvert.h>
#import <ReactABI23_0_0/ABI23_0_0RCTScrollView.h>
#import <ReactABI23_0_0/ABI23_0_0RCTTouchHandler.h>

#define VEC_LEN_SQ(pt) (pt.x * pt.x + pt.y * pt.y)
#define TEST_MIN_IF_NOT_NAN(value, limit) \
    (!isnan(limit) && ((limit < 0 && value <= limit) || (limit >= 0 && value >= limit)))

#define TEST_MAX_IF_NOT_NAN(value, max) \
    (!isnan(max) && ((max < 0 && value < max) || (max >= 0 && value > max)))

#define APPLY_PROP(recognizer, config, type, prop, propName) do { \
    id value = config[propName]; \
    if (value != nil) recognizer.prop = [ABI23_0_0RCTConvert type:value]; \
} while(0)

#define APPLY_FLOAT_PROP(prop) do { APPLY_PROP(recognizer, config, CGFloat, prop, @#prop); } while(0)
#define APPLY_INT_PROP(prop) do { APPLY_PROP(recognizer, config, NSInteger, prop, @#prop); } while(0)
#define APPLY_NAMED_INT_PROP(prop, propName) do { APPLY_PROP(recognizer, config, NSInteger, prop, propName); } while(0)

@interface UIGestureRecognizer (GestureHandler)
@property (nonatomic, readonly) ABI23_0_0RNGestureHandler *gestureHandler;
@end

@implementation UIGestureRecognizer (GestureHandler)

- (ABI23_0_0RNGestureHandler *)gestureHandler
{
    id delegate = self.delegate;
    if ([delegate isKindOfClass:[ABI23_0_0RNGestureHandler class]]) {
        return (ABI23_0_0RNGestureHandler *)delegate;
    }
    return nil;
}

@end


@interface ABI23_0_0RNDummyGestureRecognizer : UIGestureRecognizer
@end


@implementation ABI23_0_0RNDummyGestureRecognizer

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    self.state = UIGestureRecognizerStateFailed;
    [self reset];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    self.state = UIGestureRecognizerStateCancelled;
    [self reset];
}

@end


@interface ABI23_0_0RNGestureHandler () <UIGestureRecognizerDelegate>

@property(nonatomic) BOOL shouldCancelWhenOutside;

@end


@implementation ABI23_0_0RNGestureHandlerRegistry {
    NSMutableDictionary<NSNumber *, ABI23_0_0RNGestureHandler *> *_handlers;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _handlers = [NSMutableDictionary new];
    }
    return self;
}

- (ABI23_0_0RNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag
{
    return _handlers[handlerTag];
}

- (void)registerGestureHandler:(ABI23_0_0RNGestureHandler *)gestureHandler
{
    _handlers[gestureHandler.tag] = gestureHandler;
}

- (void)attachHandlerWithTag:(NSNumber *)handlerTag toView:(UIView *)view
{
    ABI23_0_0RNGestureHandler *handler = _handlers[handlerTag];
    ABI23_0_0RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
    [handler unbindFromView];
    [handler bindToView:view];
}

- (void)dropHandlerWithTag:(NSNumber *)handlerTag
{
    ABI23_0_0RNGestureHandler *handler = _handlers[handlerTag];
    [handler unbindFromView];
    [_handlers removeObjectForKey:handlerTag];
}

@end


@implementation ABI23_0_0RNGestureHandler {
    NSArray<NSNumber *> *_handlersToWaitFor;
    NSArray<NSNumber *> *_simultaniousHandlers;
    UIEdgeInsets _hitSlopEdgeInsets;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super init])) {
        _tag = tag;
        _lastState = ABI23_0_0RNGestureHandlerStateUndetermined;
        _hitSlopEdgeInsets = UIEdgeInsetsZero;
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    _handlersToWaitFor = [ABI23_0_0RCTConvert NSNumberArray:config[@"waitFor"]];
    _simultaniousHandlers = [ABI23_0_0RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];

    id prop = config[@"enabled"];
    if (prop != nil) {
        self.enabled = [ABI23_0_0RCTConvert BOOL:prop];
    } else {
        self.enabled = YES;
    }

    prop = config[@"shouldCancelWhenOutside"];
    if (prop != nil) {
        _shouldCancelWhenOutside = [ABI23_0_0RCTConvert BOOL:prop];
    } else {
        _shouldCancelWhenOutside = YES;
    }

    prop = config[@"hitSlop"];
    if (prop != nil) {
         UIEdgeInsets insets = [ABI23_0_0RCTConvert UIEdgeInsets:prop];
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

- (ABI23_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
    return [ABI23_0_0RNGestureHandlerEventExtraData
            forPosition:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
    ABI23_0_0RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
    [self sendEventsInState:self.state forViewWithTag:recognizer.view.ReactABI23_0_0Tag withExtraData:eventData];
}

- (void)sendEventsInState:(ABI23_0_0RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)ReactABI23_0_0Tag
            withExtraData:(ABI23_0_0RNGestureHandlerEventExtraData *)extraData
{
    id touchEvent = [[ABI23_0_0RNGestureHandlerEvent alloc] initWithRactTag:ReactABI23_0_0Tag
                                                        handlerTag:_tag
                                                             state:state
                                                         extraData:extraData];

    if (state != _lastState) {
        if (state == ABI23_0_0RNGestureHandlerStateEnd && _lastState != ABI23_0_0RNGestureHandlerStateActive) {
            [self.emitter sendStateChangeEvent:[[ABI23_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI23_0_0Tag
                                                                                         handlerTag:_tag
                                                                                              state:ABI23_0_0RNGestureHandlerStateActive
                                                                                          prevState:_lastState
                                                                                          extraData:extraData]];
            _lastState = ABI23_0_0RNGestureHandlerStateActive;
        }
        id stateEvent = [[ABI23_0_0RNGestureHandlerStateChange alloc] initWithRactTag:ReactABI23_0_0Tag
                                                                  handlerTag:_tag
                                                                       state:state
                                                                   prevState:_lastState
                                                                   extraData:extraData];
        [self.emitter sendStateChangeEvent:stateEvent];
        _lastState = state;
    }

    if (state == ABI23_0_0RNGestureHandlerStateActive) {
        [self.emitter sendTouchEvent:touchEvent];
    }
}

- (ABI23_0_0RNGestureHandlerState)state
{
    switch (_recognizer.state) {
        case UIGestureRecognizerStateBegan:
        case UIGestureRecognizerStatePossible:
            return ABI23_0_0RNGestureHandlerStateBegan;
        case UIGestureRecognizerStateEnded:
            return ABI23_0_0RNGestureHandlerStateEnd;
        case UIGestureRecognizerStateFailed:
            return ABI23_0_0RNGestureHandlerStateFailed;
        case UIGestureRecognizerStateCancelled:
            return ABI23_0_0RNGestureHandlerStateCancelled;
        case UIGestureRecognizerStateChanged:
            return ABI23_0_0RNGestureHandlerStateActive;
    }
    return ABI23_0_0RNGestureHandlerStateUndetermined;
}

#pragma mark UIGestureRecognizerDelegate

+ (ABI23_0_0RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
{
    ABI23_0_0RNGestureHandler *handler = recognizer.gestureHandler;
    if (handler != nil) {
        return handler;
    }

    // We may try to extract "DummyGestureHandler" in case when "otherGestureRecognizer" belongs to
    // a native view being wrapped with "NativeViewGestureHandler"
    UIView *ReactABI23_0_0View = recognizer.view;
    while (ReactABI23_0_0View != nil && ReactABI23_0_0View.ReactABI23_0_0Tag == nil) {
        ReactABI23_0_0View = ReactABI23_0_0View.superview;
    }

    for (UIGestureRecognizer *recognizer in ReactABI23_0_0View.gestureRecognizers) {
        if ([recognizer isKindOfClass:[ABI23_0_0RNDummyGestureRecognizer class]]) {
            return recognizer.gestureHandler;
        }
    }

    return nil;
}

- (BOOL)gestureRecognizer:(UIGestureRecognizer *)gestureRecognizer
shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    ABI23_0_0RNGestureHandler *handler = [ABI23_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
    if ([handler isKindOfClass:[ABI23_0_0RNNativeViewGestureHandler class]]) {
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
        ABI23_0_0RNGestureHandler *handler = [ABI23_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
        ABI23_0_0RNGestureHandler *handler = [ABI23_0_0RNGestureHandler findGestureHandlerByRecognizer:otherGestureRecognizer];
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
    _lastState = ABI23_0_0RNGestureHandlerStateUndetermined;
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


#pragma mark PanGestureHandler

@interface ABI23_0_0RNBetterPanGestureRecognizer : UIPanGestureRecognizer

@property (nonatomic) CGFloat minDeltaX;
@property (nonatomic) CGFloat minDeltaY;
@property (nonatomic) CGFloat minOffsetX;
@property (nonatomic) CGFloat minOffsetY;
@property (nonatomic) CGFloat minDistSq;
@property (nonatomic) CGFloat minVelocityX;
@property (nonatomic) CGFloat minVelocityY;
@property (nonatomic) CGFloat minVelocitySq;
@property (nonatomic) CGFloat maxDeltaX;
@property (nonatomic) CGFloat maxDeltaY;

- (id)initWithGestureHandler:(ABI23_0_0RNGestureHandler*)gestureHandler;

@end


@implementation ABI23_0_0RNBetterPanGestureRecognizer {
    __weak ABI23_0_0RNGestureHandler *_gestureHandler;
    NSUInteger _realMinimumNumberOfTouches;
    BOOL _hasCustomActivationCriteria;
}

- (id)initWithGestureHandler:(ABI23_0_0RNGestureHandler*)gestureHandler
{
    if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
        _gestureHandler = gestureHandler;
        _minDeltaX = NAN;
        _minDeltaY = NAN;
        _maxDeltaX = NAN;
        _maxDeltaY = NAN;
        _minOffsetX = NAN;
        _minOffsetY = NAN;
        _minDistSq = NAN;
        _minVelocityX = NAN;
        _minVelocityY = NAN;
        _minVelocitySq = NAN;
        _hasCustomActivationCriteria = NO;
        _realMinimumNumberOfTouches = self.minimumNumberOfTouches;
    }
    return self;
}

- (void)setMinimumNumberOfTouches:(NSUInteger)minimumNumberOfTouches
{
    _realMinimumNumberOfTouches = minimumNumberOfTouches;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    if (_hasCustomActivationCriteria) {
        // We use "minimumNumberOfTouches" property to prevent pan handler from recognizing
        // the gesture too early before we are sure that all criteria (e.g. minimum distance
        // etc. are met)
        super.minimumNumberOfTouches = 20;
    } else {
        super.minimumNumberOfTouches = _realMinimumNumberOfTouches;
    }
    [super touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesMoved:touches withEvent:event];
    if (self.state == UIGestureRecognizerStatePossible && [self shouldFailUnderCustomCriteria]) {
        self.state = UIGestureRecognizerStateFailed;
        return;
    }
    if ((self.state == UIGestureRecognizerStatePossible || self.state == UIGestureRecognizerStateChanged) && _gestureHandler.shouldCancelWhenOutside) {
        CGPoint pt = [self locationInView:self.view];
        if (!CGRectContainsPoint(self.view.bounds, pt)) {
            // If the previous recognizer state is UIGestureRecognizerStateChanged
            // then UIGestureRecognizer's sate machine will only transition to
            // UIGestureRecognizerStateCancelled even if you set the state to
            // UIGestureRecognizerStateFailed here. Making the behavior explicit.
            self.state = (self.state == UIGestureRecognizerStatePossible)
                ? UIGestureRecognizerStateFailed
                : UIGestureRecognizerStateCancelled;
            [self reset];
            return;
        }
    }
    if (_hasCustomActivationCriteria && self.state == UIGestureRecognizerStatePossible && [self shouldActivateUnderCustomCriteria]) {
        super.minimumNumberOfTouches = _realMinimumNumberOfTouches;
        if ([self numberOfTouches] >= _realMinimumNumberOfTouches) {
            self.state = UIGestureRecognizerStateBegan;
            [self setTranslation:CGPointMake(0, 0) inView:self.view];
        }
    }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    if (self.state == UIGestureRecognizerStateChanged) {
        self.state = UIGestureRecognizerStateEnded;
    } else {
        self.state = UIGestureRecognizerStateFailed;
    }
}

- (void)reset
{
    self.enabled = YES;
    [super reset];
}

- (void)updateHasCustomActivationCriteria
{
    _hasCustomActivationCriteria = !isnan(_minDistSq) || !isnan(_minDeltaX) || !isnan(_minDeltaY)
        || !isnan(_minOffsetX) || !isnan(_minOffsetY)
        || !isnan(_minVelocityX) || !isnan(_minVelocityY) || !isnan(_minVelocitySq);
}

- (BOOL)shouldFailUnderCustomCriteria
{
   CGPoint trans = [self translationInView:self.view];
    if (TEST_MAX_IF_NOT_NAN(fabs(trans.x), _maxDeltaX)) {
        return YES;
    }
    if (TEST_MAX_IF_NOT_NAN(fabs(trans.y), _maxDeltaY)) {
        return YES;
    }

    return NO;
}

- (BOOL)shouldActivateUnderCustomCriteria
{
    CGPoint trans = [self translationInView:self.view];
    if (TEST_MIN_IF_NOT_NAN(fabs(trans.x), _minDeltaX)) {
        return YES;
    }
    if (TEST_MIN_IF_NOT_NAN(fabs(trans.y), _minDeltaY)) {
        return YES;
    }
    if (TEST_MIN_IF_NOT_NAN(trans.x, _minOffsetX)) {
        return YES;
    }
    if (TEST_MIN_IF_NOT_NAN(trans.y, _minOffsetY)) {
        return YES;
    }
    if (TEST_MIN_IF_NOT_NAN(VEC_LEN_SQ(trans), _minDistSq)) {
        return YES;
    }

    CGPoint velocity = [self velocityInView:self.view];
    if (TEST_MIN_IF_NOT_NAN(velocity.x, _minVelocityX)) {
        return YES;
    }
    if (TEST_MIN_IF_NOT_NAN(velocity.y, _minVelocityY)) {
        return YES;
    }
    if (TEST_MIN_IF_NOT_NAN(VEC_LEN_SQ(velocity), _minVelocitySq)) {
        return YES;
    }

    return NO;
}

@end

@implementation ABI23_0_0RNPanGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI23_0_0RNBetterPanGestureRecognizer alloc] initWithGestureHandler:self];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    ABI23_0_0RNBetterPanGestureRecognizer *recognizer = (ABI23_0_0RNBetterPanGestureRecognizer *)_recognizer;

    APPLY_FLOAT_PROP(minDeltaX);
    APPLY_FLOAT_PROP(minDeltaY);
    APPLY_FLOAT_PROP(maxDeltaX);
    APPLY_FLOAT_PROP(maxDeltaY);
    APPLY_FLOAT_PROP(minOffsetX);
    APPLY_FLOAT_PROP(minOffsetY);
    APPLY_FLOAT_PROP(minVelocityX);
    APPLY_FLOAT_PROP(minVelocityY);

    APPLY_NAMED_INT_PROP(minimumNumberOfTouches, @"minPointers");
    APPLY_NAMED_INT_PROP(maximumNumberOfTouches, @"maxPointers");

    id prop = config[@"minDist"];
    if (prop != nil) {
        CGFloat dist = [ABI23_0_0RCTConvert CGFloat:prop];
        recognizer.minDistSq = dist * dist;
    }

    prop = config[@"minVelocity"];
    if (prop != nil) {
        CGFloat velocity = [ABI23_0_0RCTConvert CGFloat:prop];
        recognizer.minVelocitySq = velocity * velocity;
    }
    [recognizer updateHasCustomActivationCriteria];
}

- (ABI23_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIPanGestureRecognizer *)recognizer
{
    return [ABI23_0_0RNGestureHandlerEventExtraData
            forPan:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
            withTranslation:[recognizer translationInView:recognizer.view]
            withVelocity:[recognizer velocityInView:recognizer.view.window]];
}

@end


#pragma mark TapGestureHandler

@interface ABI23_0_0RNBetterTapGestureRecognizer : UIGestureRecognizer

@property (nonatomic) NSUInteger numberOfTaps;
@property (nonatomic) NSTimeInterval maxDelay;
@property (nonatomic) NSTimeInterval maxDuration;

- (id)initWithGestureHandler:(ABI23_0_0RNGestureHandler*)gestureHandler;

@end

@implementation ABI23_0_0RNBetterTapGestureRecognizer {
    __weak ABI23_0_0RNGestureHandler *_gestureHandler;
    NSUInteger _tapsSoFar;
}

- (id)initWithGestureHandler:(ABI23_0_0RNGestureHandler*)gestureHandler
{
    if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
        _gestureHandler = gestureHandler;
        _tapsSoFar = 0;
        _numberOfTaps = 1;
        _maxDelay = 0.2;
        _maxDuration = NAN;
    }
    return self;
}

- (void)triggerAction
{
    [_gestureHandler handleGesture:self];
}

- (void)cancel
{
    self.enabled = NO;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesBegan:touches withEvent:event];
    _tapsSoFar++;
    if (_tapsSoFar) {
        [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(cancel) object:nil];
    }
    if (!isnan(_maxDuration)) {
        [self performSelector:@selector(cancel) withObject:nil afterDelay:_maxDuration];
    }
    self.state = UIGestureRecognizerStatePossible;
    [self triggerAction];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesMoved:touches withEvent:event];

    if (self.state != UIGestureRecognizerStatePossible) {
        return;
    }

    if (_gestureHandler.shouldCancelWhenOutside) {
        CGPoint pt = [self locationInView:self.view];
        if (!CGRectContainsPoint(self.view.bounds, pt)) {
            self.state = UIGestureRecognizerStateFailed;
            [self triggerAction];
            [self reset];
            return;
        }
    }

    self.state = UIGestureRecognizerStatePossible;
    [self triggerAction];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesEnded:touches withEvent:event];
    if (_numberOfTaps == _tapsSoFar) {
        self.state = UIGestureRecognizerStateEnded;
        [self reset];
    } else {
        [self performSelector:@selector(cancel) withObject:nil afterDelay:_maxDelay];
    }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesCancelled:touches withEvent:event];
    self.state = UIGestureRecognizerStateCancelled;
    [self reset];
}

- (void)reset
{
    if (self.state == UIGestureRecognizerStateFailed) {
        [self triggerAction];
    }
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(cancel) object:nil];
    _tapsSoFar = 0;
    self.enabled = YES;
    [super reset];
}

@end

@implementation ABI23_0_0RNTapGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI23_0_0RNBetterTapGestureRecognizer alloc] initWithGestureHandler:self];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    ABI23_0_0RNBetterTapGestureRecognizer *recognizer = (ABI23_0_0RNBetterTapGestureRecognizer *)_recognizer;

    APPLY_INT_PROP(numberOfTaps);

    id prop = config[@"maxDelayMs"];
    if (prop != nil) {
        recognizer.maxDelay = [ABI23_0_0RCTConvert CGFloat:prop] / 1000.0;
    }

    prop = config[@"maxDurationMs"];
    if (prop != nil) {
        recognizer.maxDuration = [ABI23_0_0RCTConvert CGFloat:prop] / 1000.0;
    }
}

@end


#pragma mark LongPressGestureHandler

@implementation ABI23_0_0RNLongPressGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UILongPressGestureRecognizer alloc] initWithTarget:self
                                                                    action:@selector(handleGesture:)];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    UILongPressGestureRecognizer *recognizer = (UILongPressGestureRecognizer *)_recognizer;

    id prop = config[@"minDurationMs"];
    if (prop != nil) {
        recognizer.minimumPressDuration = [ABI23_0_0RCTConvert CGFloat:prop] / 1000.0;
    }
}

@end


#pragma mark NativeGestureHandler

@implementation ABI23_0_0RNNativeViewGestureHandler {
    BOOL _shouldActivateOnStart;
    BOOL _disallowInterruption;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI23_0_0RNDummyGestureRecognizer alloc] init];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    _shouldActivateOnStart = [ABI23_0_0RCTConvert BOOL:config[@"shouldActivateOnStart"]];
    _disallowInterruption = [ABI23_0_0RCTConvert BOOL:config[@"disallowInterruption"]];
}

- (void)bindToView:(UIView *)view
{
    // For UIControl based views (UIButton, UISwitch) we provide special handling that would allow
    // for properties like `disallowInterruption` to work.
    if ([view isKindOfClass:[UIControl class]]) {
        UIControl *control = (UIControl *)view;
        [control addTarget:self action:@selector(handleTouchDown:forEvent:) forControlEvents:UIControlEventTouchDown];
        [control addTarget:self action:@selector(handleTouchUpOutside:forEvent:) forControlEvents:UIControlEventTouchUpOutside];
        [control addTarget:self action:@selector(handleTouchUpInside:forEvent:) forControlEvents:UIControlEventTouchUpInside];
        [control addTarget:self action:@selector(handleDragExit:forEvent:) forControlEvents:UIControlEventTouchDragExit];
        [control addTarget:self action:@selector(handleDragEnter:forEvent:) forControlEvents:UIControlEventTouchDragEnter];
        [control addTarget:self action:@selector(handleTouchCancel:forEvent:) forControlEvents:UIControlEventTouchCancel];
    } else {
        [super bindToView:view];
    }

    // We can restore default scrollview behaviour to delay touches to scrollview's children
    // because gesture handler system can handle cancellation of scroll recognizer when JS responder
    // is set
    if ([view isKindOfClass:[ABI23_0_0RCTScrollView class]]) {
        // This part of the code is coupled with ABI23_0_0RN implementation of ScrollView native wrapper and
        // we expect for ABI23_0_0RCTScrollView component to contain a subclass of UIScrollview as the only
        // subview
        UIScrollView *scrollView = [view.subviews objectAtIndex:0];
        scrollView.delaysContentTouches = YES;
    }
}

- (void)handleTouchDown:(UIView *)sender forEvent:(UIEvent *)event
{
    [self reset];

    if (_disallowInterruption) {
        // When `disallowInterruption` is set we cancel all gesture handlers when this UIControl
        // gets DOWN event
        for (UITouch *touch in [event allTouches]) {
            for (UIGestureRecognizer *recogn in [touch gestureRecognizers]) {
                recogn.enabled = NO;
                recogn.enabled = YES;
            }
        }
    }

    [self sendEventsInState:ABI23_0_0RNGestureHandlerStateActive
             forViewWithTag:sender.ReactABI23_0_0Tag
              withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchUpOutside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI23_0_0RNGestureHandlerStateEnd
             forViewWithTag:sender.ReactABI23_0_0Tag
              withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
}

- (void)handleTouchUpInside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI23_0_0RNGestureHandlerStateEnd
             forViewWithTag:sender.ReactABI23_0_0Tag
              withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleDragExit:(UIView *)sender forEvent:(UIEvent *)event
{
    // Pointer is moved outside of the view bounds, we cancel button when `shouldCancelWhenOutside` is set
    if (self.shouldCancelWhenOutside) {
        UIControl *control = (UIControl *)sender;
        [control cancelTrackingWithEvent:event];
        [self sendEventsInState:ABI23_0_0RNGestureHandlerStateEnd
                 forViewWithTag:sender.ReactABI23_0_0Tag
                  withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
    } else {
        [self sendEventsInState:ABI23_0_0RNGestureHandlerStateActive
                 forViewWithTag:sender.ReactABI23_0_0Tag
                  withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
    }
}

- (void)handleDragEnter:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI23_0_0RNGestureHandlerStateActive
             forViewWithTag:sender.ReactABI23_0_0Tag
              withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchCancel:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:ABI23_0_0RNGestureHandlerStateCancelled
             forViewWithTag:sender.ReactABI23_0_0Tag
              withExtraData:[ABI23_0_0RNGestureHandlerEventExtraData forPointerInside:NO]];
}

@end

#pragma mark PinchGestureHandler

@implementation ABI23_0_0RNPinchGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    }
    return self;
}

- (ABI23_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIPinchGestureRecognizer *)recognizer
{
    return [ABI23_0_0RNGestureHandlerEventExtraData
            forPinch:recognizer.scale
            withFocalPoint:[recognizer locationInView:recognizer.view]
            withVelocity:recognizer.velocity];
}

@end

#pragma mark RotationGestureHandler

@implementation ABI23_0_0RNRotationGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UIRotationGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    }
    return self;
}

- (ABI23_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIRotationGestureRecognizer *)recognizer
{
    return [ABI23_0_0RNGestureHandlerEventExtraData
            forRotation:recognizer.rotation
            withAnchorPoint:[recognizer locationInView:recognizer.view]
            withVelocity:recognizer.velocity];
}

@end

#pragma mark Root View Helpers

@implementation ABI23_0_0RNRootViewGestureRecognizer
{
    BOOL _active;
}

@dynamic delegate;

- (instancetype)init
{
    if (self = [super init]) {
        self.delaysTouchesEnded = NO;
        self.delaysTouchesBegan = NO;
    }
    return self;
}

- (BOOL)shouldBeRequiredToFailByGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
    // This method is used to implement "enabled" feature for gesture handlers. We enforce gesture
    // recognizers that are connected with "disabled" handlers to wait for the root gesture
    // recognizer to fail and this way we block them from acting.
    ABI23_0_0RNGestureHandler *otherHandler = [ABI23_0_0RNGestureHandler
                                      findGestureHandlerByRecognizer:otherGestureRecognizer];
    if (otherHandler != nil && otherHandler.enabled == NO) {
        return YES;
    }
    return NO;
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
    return ![preventedGestureRecognizer isKindOfClass:[ABI23_0_0RCTTouchHandler class]];
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
    // When this method is called it means that one of handlers has activated, in this case we want
    // to send an info to JS so that it cancells all JS responders
    [self.delegate gestureRecognizer:preventingGestureRecognizer didActivateInRootView:self.view];
    return [super canBePreventedByGestureRecognizer:preventingGestureRecognizer];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    _active = YES;
    self.state = UIGestureRecognizerStatePossible;
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    self.state = UIGestureRecognizerStatePossible;
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    if (self.state == UIGestureRecognizerStateBegan || self.state == UIGestureRecognizerStateChanged) {
        self.state = UIGestureRecognizerStateEnded;
    } else {
        self.state = UIGestureRecognizerStateFailed;
    }
    [self reset];
    _active = NO;
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    self.state = UIGestureRecognizerStateCancelled;
    [self reset];
    _active = NO;
}

- (void)blockOtherRecognizers
{
    if (_active) {
        self.state = UIGestureRecognizerStateBegan;
    }
}

@end


#pragma mark Button

/**
 * Gesture Handler Button components overrides standard mechanism used by ABI23_0_0RN
 * to determine touch target, which normally would reurn the UIView that is placed
 * as the deepest element in the view hierarchy.
 * It's done this way as it allows for the actual target determination to run in JS
 * where we can travers up the view ierarchy to find first element that want to became
 * JS responder.
 *
 * Since we want to use native button (or actually a `UIControl`) we need to determine
 * the target in native. This makes it impossible for JS responder based components to
 * function as a subviews of the button component. Here we override `hitTest:withEvent:`
 * method and we only determine the target to be either a subclass of `UIControl` or a
 * view that has gesture recognizers registered.
 *
 * This "default" behaviour of target determinator should be sufficient in most of the
 * cases as in fact it is not that common UI pattern to have many nested buttons (usually
 * there are just two levels e.g. when you have clickable table cells with additional
 * buttons). In cases when the default behaviour is insufficient it is recommended to use
 * `TapGestureHandler` instead of a button which gives much better flexibility as far as
 * controlling the touch flow.
 */
@implementation ABI23_0_0RNGestureHandlerButton

- (BOOL)shouldHandleTouch:(UIView *)view
{
    return [view isKindOfClass:[UIControl class]] || [view.gestureRecognizers count] > 0;
}

- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
    UIView *inner = [super hitTest:point withEvent:event];
    while (inner && ![self shouldHandleTouch:inner]) inner = inner.superview;
    return inner;
}

@end
