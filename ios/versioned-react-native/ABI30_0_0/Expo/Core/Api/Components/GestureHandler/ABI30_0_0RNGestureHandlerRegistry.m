//
//  ABI30_0_0RNGestureHandlerRegistry.m
//  ABI30_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI30_0_0RNGestureHandlerRegistry.h"

#import <ReactABI30_0_0/ABI30_0_0RCTAssert.h>

@implementation ABI30_0_0RNGestureHandlerRegistry {
    NSMutableDictionary<NSNumber *, ABI30_0_0RNGestureHandler *> *_handlers;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _handlers = [NSMutableDictionary new];
    }
    return self;
}

- (ABI30_0_0RNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag
{
    return _handlers[handlerTag];
}

- (void)registerGestureHandler:(ABI30_0_0RNGestureHandler *)gestureHandler
{
    _handlers[gestureHandler.tag] = gestureHandler;
}

- (void)attachHandlerWithTag:(NSNumber *)handlerTag toView:(UIView *)view
{
    ABI30_0_0RNGestureHandler *handler = _handlers[handlerTag];
    ABI30_0_0RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
    [handler unbindFromView];
    [handler bindToView:view];
}

- (void)dropHandlerWithTag:(NSNumber *)handlerTag
{
    ABI30_0_0RNGestureHandler *handler = _handlers[handlerTag];
    [handler unbindFromView];
    [_handlers removeObjectForKey:handlerTag];
}

@end
