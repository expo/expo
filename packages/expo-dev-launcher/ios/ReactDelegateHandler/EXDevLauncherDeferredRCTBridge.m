// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherDeferredRCTBridge.h>

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

@implementation EXDevLauncherDeferredRCTBridge

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithDelegate:(id<RCTBridgeDelegate>)delegate launchOptions:(NSDictionary *)launchOptions
{
  // RCTBridge throws an exception for default initializer
  // and other designated initializers will create a real bridge.
  // We use a trick here to initialize a NoopNSObject and cast back to EXDevLauncherDeferredRCTBridge.
  self = (EXDevLauncherDeferredRCTBridge *)[EXDevLauncherNoopNSObject new];
  return self;
}

#pragma clang diagnostic pop

@end
