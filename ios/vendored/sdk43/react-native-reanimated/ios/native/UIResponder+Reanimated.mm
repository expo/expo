#import "UIResponder+Reanimated.h"
#import <ABI43_0_0React/ABI43_0_0RCTCxxBridgeDelegate.h>
#import <ABI43_0_0RNReanimated/NativeProxy.h>
#import <ABI43_0_0RNReanimated/ABI43_0_0REAModule.h>
#import <ABI43_0_0ReactCommon/ABI43_0_0RCTTurboModuleManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTBridge+Private.h>
#import <ABI43_0_0React/ABI43_0_0RCTCxxBridgeDelegate.h>
#import <ABI43_0_0RNReanimated/ABI43_0_0REAEventDispatcher.h>

#if RNVERSION >= 64
#import <ABI43_0_0React/ABI43_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ABI43_0_0ReactCommon/BridgeJSCallInvoker.h>
#endif

#if __has_include(<ABI43_0_0React/ABI43_0_0HermesExecutorFactory.h>)
#import <ABI43_0_0React/ABI43_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI43_0_0React/ABI43_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@interface ABI43_0_0RCTEventDispatcher(Reanimated)

- (void)setBridge:(ABI43_0_0RCTBridge*)bridge;

@end

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI43_0_0facebook::ABI43_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI43_0_0RCTBridge *)bridge
{
  [bridge moduleForClass:[ABI43_0_0RCTEventDispatcher class]];
  ABI43_0_0RCTEventDispatcher *eventDispatcher = [ABI43_0_0REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
   ABI43_0_0_bridge_reanimated = bridge;
  __weak __typeof(self) weakSelf = self;

  const auto executor = [weakSelf, bridge](ABI43_0_0facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
#if RNVERSION >= 63
      auto reanimatedModule = ABI43_0_0reanimated::createReanimatedModule(bridge.jsCallInvoker);
#else
      auto callInvoker = std::make_shared<ABI43_0_0React::BridgeJSCallInvoker>(bridge.reactInstance);
      auto reanimatedModule = ABI43_0_0reanimated::createReanimatedModule(callInvoker);
#endif
      runtime.global().setProperty(runtime,
                                   jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                   jsi::Object::createFromHostObject(runtime, reanimatedModule));
    }
  };

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI43_0_0RCTJSIExecutorRuntimeInstaller(executor));
#else
  return std::make_unique<ExecutorFactory>(executor);
#endif
}

@end

#endif
