// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/EXRCTBridgeDelegateInterceptor.h>

@implementation EXRCTBridgeDelegateInterceptor

- (instancetype)initWithBridgeDelegate:(id<RCTBridgeDelegate>)bridgeDelegate interceptor:(id<RCTBridgeDelegate>)interceptor
{
  if (self = [super init]) {
    self.bridgeDelegate = bridgeDelegate;
    self.interceptor = interceptor;
  }
  return self;
}

- (BOOL)conformsToProtocol:(Protocol *)protocol
{
  return [self.bridgeDelegate conformsToProtocol:protocol];
}

- (id)forwardingTargetForSelector:(SEL)selector
{
  if ([self isInterceptedSelector:selector]) {
    return self;
  }
  return self.bridgeDelegate;
}

- (BOOL)respondsToSelector:(SEL)selector
{
  if ([self isInterceptedSelector:selector]) {
    return YES;
  }
  return [self.bridgeDelegate respondsToSelector:selector];
}

- (BOOL)isInterceptedSelector:(SEL)selector
{
  if ([self.interceptor respondsToSelector:selector]) {
    return YES;
  }
  return NO;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
  return [self.interceptor sourceURLForBridge:bridge];
}

@end
