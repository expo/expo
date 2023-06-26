#if ABI49_0_0REACT_NATIVE_MINOR_VERSION >= 72 && !defined(ABI49_0_0RCT_NEW_ARCH_ENABLED) && !defined(DONT_AUTOINSTALL_REANIMATED)

#import <ABI49_0_0RNReanimated/ABI49_0_0RCTAppDelegate+Reanimated.h>
#import <ABI49_0_0RNReanimated/ABI49_0_0REAInitializer.h>
#import <objc/runtime.h>

@implementation ABI49_0_0RCTAppDelegate (Reanimated)

- (std::unique_ptr<ABI49_0_0facebook::ABI49_0_0React::JSExecutorFactory>)reanimated_jsExecutorFactoryForBridge:(ABI49_0_0RCTBridge *)bridge
{
  ABI49_0_0reanimated::ABI49_0_0REAInitializer(bridge);
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
