// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXUpdates/DeferredRCTBridge.h>

@implementation DeferredRCTBridge

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  // RCTBridge throws an exception for default initializer
  // and other designated initializers will create a real bridge.
  // We use a trick here to initialize a NSObject and cast back to DeferredRCTBridge.
  self = (DeferredRCTBridge *)[NSObject new];
  return self;
}

#pragma clang diagnostic pop

@end
