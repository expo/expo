// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXUpdates/EXDeferredRCTBridge.h>

@interface EXNoopNSObject : NSObject

@end

@implementation EXNoopNSObject

- (NSMethodSignature *)methodSignatureForSelector:(SEL)aSelector
{
  NSMethodSignature *signature = [super methodSignatureForSelector:aSelector];
  if (!signature) {
    signature = [NSMethodSignature signatureWithObjCTypes:"@@:"];
  }
  return signature;
}

- (void)forwardInvocation:(NSInvocation *)anInvocation
{
  id nilPtr = nil;
  [anInvocation setReturnValue:&nilPtr];
}

@end

@implementation EXDeferredRCTBridge

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  // RCTBridge throws an exception for default initializer
  // and other designated initializers will create a real bridge.
  // We use a trick here to initialize a NoopNSObject and cast back to EXDeferredRCTBridge.
  self = (EXDeferredRCTBridge *)[EXNoopNSObject new];
  return self;
}

#pragma clang diagnostic pop

@end
