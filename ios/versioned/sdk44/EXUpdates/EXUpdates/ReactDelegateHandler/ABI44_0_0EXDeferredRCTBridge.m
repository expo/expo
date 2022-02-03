// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI44_0_0EXUpdates/ABI44_0_0EXDeferredRCTBridge.h>

@interface ABI44_0_0EXNoopNSObject : NSObject

@end

@implementation ABI44_0_0EXNoopNSObject

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

@implementation ABI44_0_0EXDeferredRCTBridge

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithDelegate:(id<ABI44_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  // ABI44_0_0RCTBridge throws an exception for default initializer
  // and other designated initializers will create a real bridge.
  // We use a trick here to initialize a NoopNSObject and cast back to ABI44_0_0EXDeferredRCTBridge.
  self = (ABI44_0_0EXDeferredRCTBridge *)[ABI44_0_0EXNoopNSObject new];
  return self;
}

#pragma clang diagnostic pop

@end
