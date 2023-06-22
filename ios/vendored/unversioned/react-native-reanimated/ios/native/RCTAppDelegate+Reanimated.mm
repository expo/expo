#if REACT_NATIVE_MINOR_VERSION >= 72 && !defined(RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <RNReanimated/RCTAppDelegate+Reanimated.h>
#import <RNReanimated/REAInitializer.h>
#import <objc/runtime.h>

@implementation RCTAppDelegate (Reanimated)

- (std::unique_ptr<facebook::react::JSExecutorFactory>)reanimated_jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  reanimated::REAInitializer(bridge);
  return [self reanimated_jsExecutorFactoryForBridge:bridge]; // call the original method
}

+ (void)load
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class cls = [self class];
    Method originalMethod = class_getInstanceMethod(cls, @selector(jsExecutorFactoryForBridge:));
    Method swizzledMethod = class_getInstanceMethod(cls, @selector(reanimated_jsExecutorFactoryForBridge:));
    method_exchangeImplementations(originalMethod, swizzledMethod);
  });
}

@end

#endif
