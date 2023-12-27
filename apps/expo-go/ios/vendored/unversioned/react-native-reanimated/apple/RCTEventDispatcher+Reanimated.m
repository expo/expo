#ifndef RCT_NEW_ARCH_ENABLED

#import <RNReanimated/RCTEventDispatcher+Reanimated.h>
#import <RNReanimated/REAModule.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTEventDispatcher.h>
#import <objc/message.h>

@implementation RCTEventDispatcher (Reanimated)

- (void)reanimated_sendEvent:(id<RCTEvent>)event
{
  // Pass the event to Reanimated
  static __weak RCTBridge *bridge;
  static __weak REAModule *reaModule;
  if (bridge != self.bridge) {
    bridge = self.bridge;
    reaModule = nil;
  }
  if (reaModule == nil) {
    reaModule = [bridge moduleForName:@"ReanimatedModule"];
  }
  [reaModule eventDispatcherWillDispatchEvent:event];

  // Pass the event to React Native by calling the original method
  [self reanimated_sendEvent:event];
}

+ (void)load
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    Class class = [self class];
    Method originalMethod = class_getInstanceMethod(class, @selector(sendEvent:));
    Method swizzledMethod = class_getInstanceMethod(class, @selector(reanimated_sendEvent:));
    method_exchangeImplementations(originalMethod, swizzledMethod);
  });
}

@end

#endif // RCT_NEW_ARCH_ENABLED
