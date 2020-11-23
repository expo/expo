#import "ABI40_0_0UIResponder+Reanimated.h"
#import <ABI40_0_0React/ABI40_0_0RCTCxxBridgeDelegate.h>
#import "ABI40_0_0NativeProxy.h"
#import "ABI40_0_0REAModule.h"
#import <ABI40_0_0React/ABI40_0_0JSCExecutorFactory.h>
#import <ABI40_0_0ReactCommon/ABI40_0_0RCTTurboModuleManager.h>
#import <ABI40_0_0React/ABI40_0_0RCTBridge+Private.h>
#import <ABI40_0_0React/ABI40_0_0RCTCxxBridgeDelegate.h>
#import "ABI40_0_0REAEventDispatcher.h"

#ifndef DONT_AUTOINSTALL_REANIMATED

@interface ABI40_0_0RCTEventDispatcher(Reanimated)

- (void)setBridge:(ABI40_0_0RCTBridge*)bridge;

@end

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI40_0_0facebook::ABI40_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI40_0_0RCTBridge *)bridge
{
  [bridge moduleForClass:[ABI40_0_0RCTEventDispatcher class]];
  ABI40_0_0RCTEventDispatcher *eventDispatcher = [ABI40_0_0REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
   ABI40_0_0_bridge_reanimated = bridge;
  __weak __typeof(self) weakSelf = self;
  return std::make_unique<ABI40_0_0facebook::ABI40_0_0React::JSCExecutorFactory>([weakSelf, bridge](ABI40_0_0facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      auto reanimatedModule = ABI40_0_0reanimated::createReanimatedModule(bridge.jsCallInvoker);
      runtime.global().setProperty(runtime,
                                   jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                   jsi::Object::createFromHostObject(runtime, reanimatedModule)
      );
    }
  });
}

@end

#endif
