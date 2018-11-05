//
//  RNRotationHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNRotationHandler.h"

@implementation RNRotationGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UIRotationGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    }
    return self;
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(UIRotationGestureRecognizer *)recognizer
{
    return [RNGestureHandlerEventExtraData
            forRotation:recognizer.rotation
            withAnchorPoint:[recognizer locationInView:recognizer.view]
            withVelocity:recognizer.velocity
            withNumberOfTouches:recognizer.numberOfTouches];
}

@end

