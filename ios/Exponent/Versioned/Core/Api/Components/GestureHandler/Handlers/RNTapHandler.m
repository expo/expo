//
//  RNTapHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNTapHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <React/RCTConvert.h>

// RNBetterTapGestureRecognizer extends UIPanGestureRecognizer instead of UITapGestureRecognizer so that
// translationInView can be used to make the recognizer respect max deltas constraint. Also parameters like
// maxDelay and maxDuration are not configurable in UITapGestureRecognizer and therefore require custom
// implementation.

@interface RNBetterTapGestureRecognizer : UIPanGestureRecognizer

@property (nonatomic) NSUInteger numberOfTaps;
@property (nonatomic) NSTimeInterval maxDelay;
@property (nonatomic) NSTimeInterval maxDuration;
@property (nonatomic) CGFloat maxDistSq;
@property (nonatomic) CGFloat maxDeltaX;
@property (nonatomic) CGFloat maxDeltaY;

@property (nonatomic) CGFloat currentNumberOfTaps;
@property (nonatomic) CGPoint currentLocation;
@property (nonatomic) CGPoint deltaLocation;
@property (nonatomic) NSInteger minPointers;
@property (nonatomic) NSInteger maxNumberOfTouches;

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
        _minPointers = 1;
        _maxDuration = NAN;
        _maxDeltaX = NAN;
        _maxDeltaY = NAN;
        _maxDistSq = NAN;
        _maxNumberOfTouches = 0;
        super.minimumNumberOfTouches = 20;
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
    _tapsSoFar++;
    NSInteger numberOfTouches = [touches count];
    if (numberOfTouches > _maxNumberOfTouches) {
        _maxNumberOfTouches = numberOfTouches;
    }
    if (_tapsSoFar) {
        [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(cancel) object:nil];
    }
    if (!isnan(_maxDuration)) {
        [self performSelector:@selector(cancel) withObject:nil afterDelay:_maxDuration];
    }

    [super touchesBegan:touches withEvent:event];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesMoved:touches withEvent:event];
    NSInteger numberOfTouches = [touches count];
    if (self.state != UIGestureRecognizerStatePossible) {
        return;
    }
    
    if (numberOfTouches > _maxNumberOfTouches) {
        _maxNumberOfTouches = numberOfTouches;
    }

    
    if ([self shouldFailUnderCustomCriteria]) {
        self.state = UIGestureRecognizerStateFailed;
        [self triggerAction];
        [self reset];
        return;
    }

    self.state = UIGestureRecognizerStatePossible;
    [self triggerAction];
    return;
}

- (BOOL)shouldFailUnderCustomCriteria
{
    if (_gestureHandler.shouldCancelWhenOutside) {
        CGPoint pt = [self locationInView:self.view];
        if (!CGRectContainsPoint(self.view.bounds, pt)) {
            return YES;
        }
    }

    CGPoint trans = [self translationInView:self.view];
    if (TEST_MAX_IF_NOT_NAN(fabs(trans.x), _maxDeltaX)) {
        return YES;
    }
    if (TEST_MAX_IF_NOT_NAN(fabs(trans.y), _maxDeltaY)) {
        return YES;
    }
    if (TEST_MAX_IF_NOT_NAN(fabs(trans.y * trans.y + trans.x + trans.x), _maxDistSq)) {
        return YES;
    }
    return NO;
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    if (_numberOfTaps == _tapsSoFar && _maxNumberOfTouches >= _minPointers) {
        self.state = UIGestureRecognizerStateBegan;
        [super touchesEnded:touches withEvent:event];
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
    _maxNumberOfTouches = 0;
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
    APPLY_INT_PROP(minPointers);
    APPLY_FLOAT_PROP(maxDeltaX);
    APPLY_FLOAT_PROP(maxDeltaY);

    id prop = config[@"maxDelayMs"];
    if (prop != nil) {
        recognizer.maxDelay = [RCTConvert CGFloat:prop] / 1000.0;
    }

    prop = config[@"maxDurationMs"];
    if (prop != nil) {
        recognizer.maxDuration = [RCTConvert CGFloat:prop] / 1000.0;
    }

    prop = config[@"maxDist"];
    if (prop != nil) {
        CGFloat dist = [RCTConvert CGFloat:prop];
        recognizer.maxDistSq = dist * dist;
    }

}

@end

