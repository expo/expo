//
//  ABI30_0_0RNLongPressHandler.m
//  ABI30_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI30_0_0RNLongPressHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <ReactABI30_0_0/ABI30_0_0RCTConvert.h>

@interface ABI30_0_0RNBetterLongPressGestureRecognizer : UILongPressGestureRecognizer

- (id)initWithGestureHandler:(ABI30_0_0RNGestureHandler*)gestureHandler;

@end

@implementation ABI30_0_0RNBetterLongPressGestureRecognizer {
    __weak ABI30_0_0RNGestureHandler *_gestureHandler;
}

- (id)initWithGestureHandler:(ABI30_0_0RNGestureHandler*)gestureHandler
{
    if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
        _gestureHandler = gestureHandler;
    }
    return self;
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
    [super touchesMoved:touches withEvent:event];

    if (_gestureHandler.shouldCancelWhenOutside) {
        CGPoint pt = [self locationInView:self.view];
        if (!CGRectContainsPoint(self.view.bounds, pt)) {
            self.enabled = NO;
            self.enabled = YES;
        }
    }
}

@end


@implementation ABI30_0_0RNLongPressGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[ABI30_0_0RNBetterLongPressGestureRecognizer alloc] initWithGestureHandler:self];
    }
    return self;
}

- (void)configure:(NSDictionary *)config
{
    [super configure:config];
    UILongPressGestureRecognizer *recognizer = (UILongPressGestureRecognizer *)_recognizer;

    id prop = config[@"minDurationMs"];
    if (prop != nil) {
        recognizer.minimumPressDuration = [ABI30_0_0RCTConvert CGFloat:prop] / 1000.0;
    }

    prop = config[@"maxDist"];
    if (prop != nil) {
        recognizer.allowableMovement = [ABI30_0_0RCTConvert CGFloat:prop];
    }
}

- (ABI30_0_0RNGestureHandlerState)state
{
    // For long press recognizer we treat "Began" state as "active"
    // as it changes its state to "Began" as soon as the the minimum
    // hold duration timeout is reached, whereas state "Changed" is
    // only set after "Began" phase if there is some movement.
    if (_recognizer.state == UIGestureRecognizerStateBegan) {
        return ABI30_0_0RNGestureHandlerStateActive;
    }
    return [super state];
}
@end

