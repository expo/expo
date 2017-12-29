//
//  ABI24_0_0RNRotationHandler.m
//  ABI24_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI24_0_0RNRotationHandler.h"

@implementation ABI24_0_0RNRotationGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
    if ((self = [super initWithTag:tag])) {
        _recognizer = [[UIRotationGestureRecognizer alloc] initWithTarget:self action:@selector(handleGesture:)];
    }
    return self;
}

- (ABI24_0_0RNGestureHandlerEventExtraData *)eventExtraData:(UIRotationGestureRecognizer *)recognizer
{
    return [ABI24_0_0RNGestureHandlerEventExtraData
            forRotation:recognizer.rotation
            withAnchorPoint:[recognizer locationInView:recognizer.view]
            withVelocity:recognizer.velocity];
}

@end

