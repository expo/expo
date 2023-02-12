//
//  DevMenuRNGestureHandlerRegistry.m
//  DevMenuRNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "DevMenuRNGestureHandlerRegistry.h"

#import <React/RCTAssert.h>

@implementation DevMenuRNGestureHandlerRegistry {
    NSMutableDictionary<NSNumber *, DevMenuRNGestureHandler *> *_handlers;
}

- (instancetype)init
{
    if ((self = [super init])) {
        _handlers = [NSMutableDictionary new];
    }
    return self;
}

- (DevMenuRNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag
{
    return _handlers[handlerTag];
}

- (void)registerGestureHandler:(DevMenuRNGestureHandler *)gestureHandler
{
    _handlers[gestureHandler.tag] = gestureHandler;
}

- (void)attachHandlerWithTag:(NSNumber *)handlerTag toView:(UIView *)view
{
    DevMenuRNGestureHandler *handler = _handlers[handlerTag];
    RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
    [handler unbindFromView];
    handler.usesDeviceEvents = NO;
    [handler bindToView:view];
}

- (void)attachHandlerWithTagForDeviceEvents:(NSNumber *)handlerTag toView:(UIView *)view
{
    DevMenuRNGestureHandler *handler = _handlers[handlerTag];
    RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
    [handler unbindFromView];
    handler.usesDeviceEvents = YES;
    [handler bindToView:view];
}

- (void)dropHandlerWithTag:(NSNumber *)handlerTag
{
    DevMenuRNGestureHandler *handler = _handlers[handlerTag];
    [handler unbindFromView];
    [_handlers removeObjectForKey:handlerTag];
}

@end
