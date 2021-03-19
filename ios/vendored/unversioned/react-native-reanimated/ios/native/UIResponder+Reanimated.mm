#import "UIResponder+Reanimated.h"
#import <React/RCTCxxBridgeDelegate.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAModule.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <RNReanimated/REAEventDispatcher.h>

#if RNVERSION >= 64
#import <React/RCTJSIExecutorRuntimeInstaller.h>
#endif

#if RNVERSION < 63
#import <ReactCommon/BridgeJSCallInvoker.h>
#endif

#if __has_include(<React/HermesExecutorFactory.h>)
#import <React/HermesExecutorFactory.h>
typedef HermesExecutorFactory ExecutorFactory;
#else
#import <React/JSCExecutorFactory.h>
typedef JSCExecutorFactory ExecutorFactory;
#endif

#ifndef DONT_AUTOINSTALL_REANIMATED

@interface RCTEventDispatcher(Reanimated)

- (void)setBridge:(RCTBridge*)bridge;

@end

@implementation UIResponder (Reanimated)
- (std::unique_ptr<facebook::react::JSExecutorFactory>)jsExecutorFactoryForBridge:(RCTBridge *)bridge
{
  [bridge moduleForClass:[RCTEventDispatcher class]];
  RCTEventDispatcher *eventDispatcher = [REAEventDispatcher new];
  [eventDispatcher setBridge:bridge];
  [bridge updateModuleWithInstance:eventDispatcher];
   _bridge_reanimated = bridge;
  __weak __typeof(self) weakSelf = self;

  const auto executor = [weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
#if RNVERSION >= 63
      auto reanimatedModule = reanimated::createReanimatedModule(bridge.jsCallInvoker);
#else
      auto callInvoker = std::make_shared<react::BridgeJSCallInvoker>(bridge.reactInstance);
      auto reanimatedModule = reanimated::createReanimatedModule(callInvoker);
#endif
      runtime.global().setProperty(runtime,
                                   jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                   jsi::Object::createFromHostObject(runtime, reanimatedModule));
    }
  };

#if RNVERSION >= 64
  // installs globals such as console, nativePerformanceNow, etc.
  return std::make_unique<ExecutorFactory>(RCTJSIExecutorRuntimeInstaller(executor));
#else
  return std::make_unique<ExecutorFactory>(executor);
#endif
}

@end

#endif
