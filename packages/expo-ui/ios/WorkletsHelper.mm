#import "WorkletsHelper.h"
#import <React/RCTBridge+Private.h>

#if __has_include(<RNWorklets/worklets/apple/WorkletsModule.h>)
#import <RNWorklets/worklets/apple/WorkletsModule.h>
#import <RNWorklets/worklets/NativeModules/WorkletsModuleProxy.h>
#import <RNWorklets/worklets/WorkletRuntime/WorkletRuntime.h>
#define HAS_WORKLETS 1
#else
#define HAS_WORKLETS 0
#endif

@implementation WorkletsHelper

+ (void)installGlobals {
#if HAS_WORKLETS
  RCTBridge *bridge = [RCTBridge currentBridge];
  if (!bridge) {
    NSLog(@"[ExpoUI] Bridge is nil");
    return;
  }

  WorkletsModule *workletsModule = [bridge moduleForClass:[WorkletsModule class]];
  if (!workletsModule) {
    NSLog(@"[ExpoUI] WorkletsModule not found");
    return;
  }

  std::shared_ptr<worklets::WorkletsModuleProxy> proxy = [workletsModule getWorkletsModuleProxy];
  if (!proxy) {
    NSLog(@"[ExpoUI] WorkletsModuleProxy is null - ensure worklets is initialized before calling");
    return;
  }

  std::shared_ptr<worklets::WorkletRuntime> uiRuntime = proxy->getUIWorkletRuntime();
  if (!uiRuntime) {
    NSLog(@"[ExpoUI] UI WorkletRuntime is null");
    return;
  }

  uiRuntime->runSync([](jsi::Runtime &rt) {
    rt.global().setProperty(rt, "expoUIInstalled", jsi::Value(true));

    NSLog(@"[ExpoUI] Successfully installed globals on worklet UI runtime");
  });
#else
  NSLog(@"[ExpoUI] react-native-worklets not available");
#endif
}

@end
