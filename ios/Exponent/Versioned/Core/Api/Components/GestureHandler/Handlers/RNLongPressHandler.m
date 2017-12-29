//
//  RNLongPressHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNLongPressHandler.h"

#import <React/RCTConvert.h>

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

- (RNGestureHandlerState)state
{
    // For long press recognizer we treat "Began" state as "active"
    // as it changes its state to "Began" as soon as the the minimum
    // hold duration timeout is reached, whereas state "Changed" is
    // only set after "Began" phase if there is some movement.
    if (_recognizer.state == UIGestureRecognizerStateBegan) {
        return RNGestureHandlerStateActive;
    }
    return [super state];
}

@end

