//
//  ABI48_0_0RNGestureHandlerRegistry.m
//  ABI48_0_0RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "ABI48_0_0RNGestureHandlerRegistry.h"

#import <ABI48_0_0React/ABI48_0_0RCTAssert.h>

@implementation ABI48_0_0RNGestureHandlerRegistry {
  NSMutableDictionary<NSNumber *, ABI48_0_0RNGestureHandler *> *_handlers;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _handlers = [NSMutableDictionary new];
  }
  return self;
}

- (ABI48_0_0RNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag
{
  return _handlers[handlerTag];
}

- (void)registerGestureHandler:(ABI48_0_0RNGestureHandler *)gestureHandler
{
  _handlers[gestureHandler.tag] = gestureHandler;
}

- (void)attachHandlerWithTag:(NSNumber *)handlerTag
                      toView:(UIView *)view
              withActionType:(ABI48_0_0RNGestureHandlerActionType)actionType
{
  ABI48_0_0RNGestureHandler *handler = _handlers[handlerTag];
  ABI48_0_0RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
  [handler unbindFromView];
  handler.actionType = actionType;
  [handler bindToView:view];
}

- (void)dropHandlerWithTag:(NSNumber *)handlerTag
{
  ABI48_0_0RNGestureHandler *handler = _handlers[handlerTag];
  [handler unbindFromView];
  [_handlers removeObjectForKey:handlerTag];
}

- (void)dropAllHandlers
{
  for (NSNumber *tag in _handlers) {
    ABI48_0_0RNGestureHandler *handler = _handlers[tag];
    [handler unbindFromView];
  }

  [_handlers removeAllObjects];
}

@end
