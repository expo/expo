// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherDeferredReactHost.h>

@interface EXDevLauncherNoopNSObject : NSObject

@end

@implementation EXDevLauncherNoopNSObject

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

@implementation EXDevLauncherDeferredReactHost

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)init
{
  // RCTBridge throws an exception for default initializer
  // and other designated initializers will create a real bridge.
  // We use a trick here to initialize a NoopNSObject and cast back to EXDevLauncherDeferredRCTBridge.
  self = (EXDevLauncherDeferredReactHost *)[EXDevLauncherNoopNSObject new];
  return self;
}

#pragma clang diagnostic pop

@end
