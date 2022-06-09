// Copyright 2018-present 650 Industries. All rights reserved.

#import <EXDevLauncher/EXDevLauncherDeferredRCTRootView.h>

@interface EXDevLauncherNoopUIView : UIView

@end

@implementation EXDevLauncherNoopUIView

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

@implementation EXDevLauncherDeferredRCTRootView

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wobjc-designated-initializers"

- (instancetype)initWithBridge:(RCTBridge *)bridge
                    moduleName:(NSString *)moduleName
             initialProperties:(NSDictionary *)initialProperties
{
  // RCTRootView throws an exception for default initializers
  // and other designated initializers requires a real bridge.
  // We use a trick here to initialize a NoopUIView and cast back to EXDevLauncherDeferredRCTRootView.
  self = (EXDevLauncherDeferredRCTRootView *)[[EXDevLauncherNoopUIView alloc] initWithFrame:CGRectZero];
  return self;
}

#pragma clang diagnostic pop

@end

