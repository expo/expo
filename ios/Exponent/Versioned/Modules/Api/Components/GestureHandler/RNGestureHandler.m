#import "RNGestureHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <React/UIView+React.h>
#import <React/RCTConvert.h>
#import <React/RCTScrollView.h>
#import <React/RCTTouchHandler.h>

#define VEC_LEN_SQ(pt) (pt.x * pt.x + pt.y * pt.y)
#define TEST_MIN_IF_NOT_NAN(value, limit) \
    (!isnan(limit) && ((limit < 0 && value <= limit) || (limit >= 0 && value >= limit)))

#define TEST_MAX_IF_NOT_NAN(value, max) \
    (!isnan(max) && ((max < 0 && value < max) || (max >= 0 && value > max)))

#define APPLY_PROP(recognizer, config, type, prop, propName) do { \
    id value = config[propName]; \
    if (value != nil) recognizer.prop = [RCTConvert type:value]; \
} while(0)

#define APPLY_FLOAT_PROP(prop) do { APPLY_PROP(recognizer, config, CGFloat, prop, @#prop); } while(0)
#define APPLY_INT_PROP(prop) do { APPLY_PROP(recognizer, config, NSInteger, prop, @#prop); } while(0)
#define APPLY_NAMED_INT_PROP(prop, propName) do { APPLY_PROP(recognizer, config, NSInteger, prop, propName); } while(0)

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


@interface RNDummyGestureRecognizer : UIGestureRecognizer
@end


@implementation RNDummyGestureRecognizer

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


@interface RNGestureHandler () <UIGestureRecognizerDelegate>

@property(nonatomic) BOOL shouldCancelWhenOutside;

@end


@implementation RNGestureHandlerRegistry {
    NSMutableDictionary<NSNumber *, RNGestureHandler *> *_handlers;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _handlers = [NSMutableDictionary new];
    }
    return self;
}

- (RNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag
{
    return _handlers[handlerTag];
}

- (void)registerGestureHandler:(RNGestureHandler *)gestureHandler
{
    _handlers[gestureHandler.tag] = gestureHandler;
}

- (void)attachHandlerWithTag:(NSNumber *)handlerTag toView:(UIView *)view
{
    RNGestureHandler *handler = _handlers[handlerTag];
    RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
    [handler unbindFromView];
    [handler bindToView:view];
}

- (void)dropHandlerWithTag:(NSNumber *)handlerTag
{
    RNGestureHandler *handler = _handlers[handlerTag];
    [handler unbindFromView];
    [_handlers removeObjectForKey:handlerTag];
}

@end


@implementation RNGestureHandler {
    NSArray<NSNumber *> *_handlersToWaitFor;
    NSArray<NSNumber *> *_simultaniousHandlers;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super init])) {
        _tag = tag;
        _lastState = RNGestureHandlerStateUndetermined;
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    _handlersToWaitFor = [RCTConvert NSNumberArray:config[@"waitFor"]];
    _simultaniousHandlers = [RCTConvert NSNumberArray:config[@"simultaneousHandlers"]];

    id prop = config[@"shouldCancelWhenOutside"];
    if (prop != nil) {
        _shouldCancelWhenOutside = [RCTConvert BOOL:prop];
    } else {
        _shouldCancelWhenOutside = YES;
    }
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

- (RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer
{
    return [RNGestureHandlerEventExtraData forPosition:[recognizer locationInView:[recognizer view]]];
}

- (void)handleGesture:(UIGestureRecognizer *)recognizer
{
    RNGestureHandlerEventExtraData *eventData = [self eventExtraData:recognizer];
    [self sendEventsInState:self.state forViewWithTag:recognizer.view.reactTag withExtraData:eventData];
}

- (void)sendEventsInState:(RNGestureHandlerState)state
           forViewWithTag:(nonnull NSNumber *)reactTag
            withExtraData:(RNGestureHandlerEventExtraData *)extraData
{
    id touchEvent = [[RNGestureHandlerEvent alloc] initWithRactTag:reactTag
                                                        handlerTag:_tag
                                                             state:state
                                                         extraData:extraData];

    if (state != _lastState) {
        if (state == RNGestureHandlerStateEnd && _lastState != RNGestureHandlerStateActive) {
            [self.emitter sendStateChangeEvent:[[RNGestureHandlerStateChange alloc] initWithRactTag:reactTag
                                                                                         handlerTag:_tag
                                                                                              state:RNGestureHandlerStateActive
                                                                                          prevState:_lastState
                                                                                          extraData:extraData]];
            _lastState = RNGestureHandlerStateActive;
        }
        id stateEvent = [[RNGestureHandlerStateChange alloc] initWithRactTag:reactTag
                                                                  handlerTag:_tag
                                                                       state:state
                                                                   prevState:_lastState
                                                                   extraData:extraData];
        [self.emitter sendStateChangeEvent:stateEvent];
        _lastState = state;
    }

    if (state == RNGestureHandlerStateActive) {
        [self.emitter sendTouchEvent:touchEvent];
    }
}

- (RNGestureHandlerState)state
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

#pragma mark UIGestureRecognizerDelegate

- (RNGestureHandler *)findGestureHandlerByRecognizer:(UIGestureRecognizer *)recognizer
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
    RNGestureHandler *handler = [self findGestureHandlerByRecognizer:otherGestureRecognizer];
    if ([handler isKindOfClass:[RNNativeViewGestureHandler class]]) {
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
        RNGestureHandler *handler = [self findGestureHandlerByRecognizer:otherGestureRecognizer];
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
        RNGestureHandler *handler = [self findGestureHandlerByRecognizer:otherGestureRecognizer];
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
    _lastState = RNGestureHandlerStateUndetermined;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
    [self reset];
    return YES;
}

@end


#pragma mark PanGestureHandler

@interface RNBetterPanGestureRecognizer : UIPanGestureRecognizer

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

- (id)initWithGestureHandler:(RNGestureHandler*)gestureHandler;

@end


@implementation RNBetterPanGestureRecognizer {
    __weak RNGestureHandler *_gestureHandler;
    NSUInteger _realMinimumNumberOfTouches;
    BOOL _hasCustomActivationCriteria;
}

- (id)initWithGestureHandler:(RNGestureHandler*)gestureHandler
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

@implementation RNPanGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[RNBetterPanGestureRecognizer alloc] initWithGestureHandler:self];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    RNBetterPanGestureRecognizer *recognizer = (RNBetterPanGestureRecognizer *)_recognizer;

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
        CGFloat dist = [RCTConvert CGFloat:prop];
        recognizer.minDistSq = dist * dist;
    }

    prop = config[@"minVelocity"];
    if (prop != nil) {
        CGFloat velocity = [RCTConvert CGFloat:prop];
        recognizer.minVelocitySq = velocity * velocity;
    }
    
    [recognizer updateHasCustomActivationCriteria];
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer
{
    return [RNGestureHandlerEventExtraData
            forPan:[recognizer locationInView:[recognizer view]]
            withTranslation:[recognizer translationInView:[recognizer view]]
            withVelocity:[recognizer velocityInView:[recognizer view]]];
}

@end


#pragma mark TapGestureHandler

@interface RNBetterTapGestureRecognizer : UIGestureRecognizer

@property (nonatomic) NSUInteger numberOfTaps;
@property (nonatomic) NSTimeInterval maxDelay;
@property (nonatomic) NSTimeInterval maxDuration;

- (id)initWithGestureHandler:(RNGestureHandler*)gestureHandler;

@end

@implementation RNBetterTapGestureRecognizer {
    __weak RNGestureHandler *_gestureHandler;
    NSUInteger _tapsSoFar;
}

- (id)initWithGestureHandler:(RNGestureHandler*)gestureHandler
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
        if (pt.x < 0. || pt.y < 0. || pt.x > self.view.frame.size.width || pt.y > self.view.frame.size.height) {
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

@implementation RNTapGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[RNBetterTapGestureRecognizer alloc] initWithGestureHandler:self];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    RNBetterTapGestureRecognizer *recognizer = (RNBetterTapGestureRecognizer *)_recognizer;

    APPLY_INT_PROP(numberOfTaps);

    id prop = config[@"maxDelayMs"];
    if (prop != nil) {
        recognizer.maxDelay = [RCTConvert CGFloat:prop] / 1000.0;
    }

    prop = config[@"maxDurationMs"];
    if (prop != nil) {
        recognizer.maxDuration = [RCTConvert CGFloat:prop] / 1000.0;
    }
}

@end


#pragma mark LongPressGestureHandler

@implementation RNLongPressGestureHandler

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
        recognizer.minimumPressDuration = [RCTConvert CGFloat:prop] / 1000.0;
    }
}

@end


#pragma mark NativeGestureHandler

@implementation RNNativeViewGestureHandler {
    BOOL _shouldActivateOnStart;
    BOOL _disallowInterruption;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[RNDummyGestureRecognizer alloc] init];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    _shouldActivateOnStart = [RCTConvert BOOL:config[@"shouldActivateOnStart"]];
    _disallowInterruption = [RCTConvert BOOL:config[@"disallowInterruption"]];
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
    if ([view isKindOfClass:[RCTScrollView class]]) {
        // This part of the code is coupled with RN implementation of ScrollView native wrapper and
        // we expect for RCTScrollView component to contain a subclass of UIScrollview as the only
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

    [self sendEventsInState:RNGestureHandlerStateActive
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchUpOutside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:RNGestureHandlerStateEnd
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
}

- (void)handleTouchUpInside:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:RNGestureHandlerStateEnd
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleDragExit:(UIView *)sender forEvent:(UIEvent *)event
{
    // Pointer is moved outside of the view bounds, we cancel button when `shouldCancelWhenOutside` is set
    if (self.shouldCancelWhenOutside) {
        UIControl *control = (UIControl *)sender;
        [control cancelTrackingWithEvent:event];
        [self sendEventsInState:RNGestureHandlerStateEnd
                 forViewWithTag:sender.reactTag
                  withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
    } else {
        [self sendEventsInState:RNGestureHandlerStateActive
                 forViewWithTag:sender.reactTag
                  withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
    }
}

- (void)handleDragEnter:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:RNGestureHandlerStateActive
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:YES]];
}

- (void)handleTouchCancel:(UIView *)sender forEvent:(UIEvent *)event
{
    [self sendEventsInState:RNGestureHandlerStateCancelled
             forViewWithTag:sender.reactTag
              withExtraData:[RNGestureHandlerEventExtraData forPointerInside:NO]];
}

@end

#pragma mark PinchGestureHandler

@implementation RNPinchGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UIPinchGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    }
    return self;
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer
{
    return [RNGestureHandlerEventExtraData
            forPinch:[(UIPinchGestureRecognizer *)recognizer scale]
            withVelocity:[(UIPinchGestureRecognizer *)recognizer velocity]];
}

@end

#pragma mark RotationGestureHandler

@implementation RNRotationGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UIRotationGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    }
    return self;
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(id)recognizer
{
    return [RNGestureHandlerEventExtraData
            forRotation:[(UIRotationGestureRecognizer *)recognizer rotation]
            withVelocity:[(UIRotationGestureRecognizer *)recognizer velocity]];
}

@end

#pragma mark Root View Helpers

@implementation RNRootViewGestureRecognizer
{
    BOOL _active;
}

- (instancetype)init
{
    if (self = [super init]) {
        self.delaysTouchesEnded = NO;
        self.delaysTouchesBegan = NO;
    }
    return self;
}

- (BOOL)canPreventGestureRecognizer:(UIGestureRecognizer *)preventedGestureRecognizer
{
    return ![preventedGestureRecognizer isKindOfClass:[RCTTouchHandler class]];
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
    // When this method is called it means that one of handlers has activated, in this case we want
    // to send an info to JS so that it cancells all JS responders
    [self.delegate gestureHandlerDidActivateInRootView:self.view];
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
 * Gesture Handler Button components overrides standard mechanism used by RN
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
@implementation RNGestureHandlerButton

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

