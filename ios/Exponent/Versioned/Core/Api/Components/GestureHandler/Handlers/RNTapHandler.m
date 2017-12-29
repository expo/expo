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

