//
//  RNGestureHandlerRegistry.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNGestureHandlerRegistry.h"

#import <React/RCTAssert.h>

@implementation RNGestureHandlerRegistry {
  NSMutableDictionary<NSNumber *, RNGestureHandler *> *_handlers;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _handlers = [NSMutableDictionary new];
  }
  return self;
}

- (RNGestureHandler *)handlerWithTag:(NSNumber *)handlerTag
{
  return _handlers[handlerTag];
}

- (void)registerGestureHandler:(RNGestureHandler *)gestureHandler
{
  _handlers[gestureHandler.tag] = gestureHandler;
}

- (void)attachHandlerWithTag:(NSNumber *)handlerTag
                      toView:(UIView *)view
              withActionType:(RNGestureHandlerActionType)actionType
{
  RNGestureHandler *handler = _handlers[handlerTag];
  RCTAssert(handler != nil, @"Handler for tag %@ does not exists", handlerTag);
  [handler unbindFromView];
  handler.actionType = actionType;
  [handler bindToView:view];
}

- (void)dropHandlerWithTag:(NSNumber *)handlerTag
{
  RNGestureHandler *handler = _handlers[handlerTag];
  [handler unbindFromView];
  [_handlers removeObjectForKey:handlerTag];
}

- (void)dropAllHandlers
{
  for (NSNumber *tag in _handlers) {
    RNGestureHandler *handler = _handlers[tag];
    [handler unbindFromView];
  }

  [_handlers removeAllObjects];
}

@end
