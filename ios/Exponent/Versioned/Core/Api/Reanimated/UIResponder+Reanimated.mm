#import "UIResponder+Reanimated.h"
#import <React/RCTCxxBridgeDelegate.h>
#import <RNReanimated/NativeProxy.h>
#import <RNReanimated/REAModule.h>
#import <React/JSCExecutorFactory.h>
#import <ReactCommon/RCTTurboModuleManager.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTCxxBridgeDelegate.h>
#import <RNReanimated/REAEventDispatcher.h>

#if RNVERSION == 62
#import <ReactCommon/BridgeJSCallInvoker.h>
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
  return std::make_unique<facebook::react::JSCExecutorFactory>([weakSelf, bridge](facebook::jsi::Runtime &runtime) {
    if (!bridge) {
      return;
    }
    __typeof(self) strongSelf = weakSelf;
    if (strongSelf) {
      #if RNVERSION == 62
        auto callInvoker = std::make_shared<react::BridgeJSCallInvoker>(bridge.reactInstance);
        auto reanimatedModule = reanimated::createReanimatedModule(callInvoker);
      #elif RNVERSION == 63
        auto reanimatedModule = reanimated::createReanimatedModule(bridge.jsCallInvoker);
      #endif
      runtime.global().setProperty(runtime,
                                   jsi::PropNameID::forAscii(runtime, "__reanimatedModuleProxy"),
                                   jsi::Object::createFromHostObject(runtime, reanimatedModule)
      );
    }
  });
}

@end

#endif
