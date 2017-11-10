//
//  RNPanHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNPanHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

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

- (RNGestureHandlerEventExtraData *)eventExtraData:(UIPanGestureRecognizer *)recognizer
{
    return [RNGestureHandlerEventExtraData
            forPan:[recognizer locationInView:recognizer.view]
            withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
            withTranslation:[recognizer translationInView:recognizer.view]
            withVelocity:[recognizer velocityInView:recognizer.view.window]];
}

@end

