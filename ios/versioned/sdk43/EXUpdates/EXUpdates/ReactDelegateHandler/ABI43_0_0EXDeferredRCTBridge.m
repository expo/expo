// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI43_0_0EXUpdates/ABI43_0_0EXDeferredRCTBridge.h>

@interface ABI43_0_0EXNoopNSObject : NSObject

@end

@implementation ABI43_0_0EXNoopNSObject

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

@implementation ABI43_0_0EXDeferredRCTBridge

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithDelegate:(id<ABI43_0_0RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  // ABI43_0_0RCTBridge throws an exception for default initializer
  // and other designated initializers will create a real bridge.
  // We use a trick here to initialize a NoopNSObject and cast back to ABI43_0_0EXDeferredRCTBridge.
  self = (ABI43_0_0EXDeferredRCTBridge *)[ABI43_0_0EXNoopNSObject new];
  return self;
}

#pragma clang diagnostic pop

@end
