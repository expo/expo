#import "UIResponder+Reanimated.h"
#import <ABI41_0_0React/ABI41_0_0RCTCxxBridgeDelegate.h>
#import <ABI41_0_0RNReanimated/NativeProxy.h>
#import <ABI41_0_0RNReanimated/ABI41_0_0REAModule.h>
#import <ABI41_0_0ReactCommon/ABI41_0_0RCTTurboModuleManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTBridge+Private.h>
#import <ABI41_0_0React/ABI41_0_0RCTCxxBridgeDelegate.h>
#import <ABI41_0_0RNReanimated/ABI41_0_0REAEventDispatcher.h>

#if RNVERSION >= 64
#import <ABI41_0_0React/ABI41_0_0RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ABI41_0_0ReactCommon/BridgeJSCallInvoker.h>
#endif

#if __has_include(<ABI41_0_0React/ABI41_0_0HermesExecutorFactory.h>)
#import <ABI41_0_0React/ABI41_0_0HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <ABI41_0_0React/ABI41_0_0JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@interface ABI41_0_0RCTEventDispatcher(Reanimated)

- (void)setBridge:(ABI41_0_0RCTBridge*)bridge;

@end

@implementation UIResponder (Reanimated)
- (std::unique_ptr<ABI41_0_0facebook::ABI41_0_0React::JSExecutorFactory>)jsExecutorFactoryForBridge:(ABI41_0_0RCTBridge *)bridge
{
  [bridge moduleForClass:[ABI41_0_0RCTEventDispatcher class]];
  ABI41_0_0RCTEventDispatcher *eventDispatcher = [ABI41_0_0REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
   ABI41_0_0_bridge_reanimated = bridge;
  __weak __typeof(self) weakSelf = self;

  const auto executor = [weakSelf, bridge](ABI41_0_0facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
#if RNVERSION >= 63
      auto reanimatedModule = ABI41_0_0reanimated::createReanimatedModule(bridge.jsCallInvoker);
#else
      auto callInvoker = std::make_shared<ABI41_0_0React::BridgeJSCallInvoker>(bridge.reactInstance);
      auto reanimatedModule = ABI41_0_0reanimated::createReanimatedModule(callInvoker);
#endif
      runtime.global().setProperty(runtime,
                                   jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                   jsi::Object::createFromHostObject(runtime, reanimatedModule));
    }
  };

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(ABI41_0_0RCTJSIExecutorRuntimeInstaller(executor));
#else
  return std::make_unique<ExecutorFactory>(executor);
#endif
}

@end

#endif
