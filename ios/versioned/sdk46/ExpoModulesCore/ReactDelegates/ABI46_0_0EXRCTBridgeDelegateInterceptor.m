// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI46_0_0ExpoModulesCore/ABI46_0_0EXRCTBridgeDelegateInterceptor.h>

@implementation ABI46_0_0EXRCTBridgeDelegateInterceptor

- (instancetype)initWithBridgeDelegate:(id<ABI46_0_0RCTBridgeDelegate>)bridgeDelegate interceptor:(id<ABI46_0_0RCTBridgeDelegate>)interceptor
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

- (NSURL *)sourceURLForBridge:(ABI46_0_0RCTBridge *)bridge {
  return [self.interceptor sourceURLForBridge:bridge];
}

@end
