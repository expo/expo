// Copyright 2018-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXUpdates/ABI47_0_0EXDeferredRCTRootView.h>

@interface ABI47_0_0EXNoopUIView : UIView

@end

@implementation ABI47_0_0EXNoopUIView

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

@implementation ABI47_0_0EXDeferredRCTRootView

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithBridge:(ABI47_0_0RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  // ABI47_0_0RCTRootView throws an exception for default initializers
  // and other designated initializers requires a real bridge.
  // We use a trick here to initialize a NoopUIView and cast back to ABI47_0_0EXDeferredRCTRootView.
  self = (ABI47_0_0EXDeferredRCTRootView *)[[ABI47_0_0EXNoopUIView alloc] initWithFrame:CGRectZero];
  return self;
}

#pragma clang diagnostic pop

@end

