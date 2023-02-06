#import "ABI48_0_0SkiaManager.h"

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>

#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModule.h>

#import "ABI48_0_0RNSkiOSPlatformContext.h"

@implementation ABI48_0_0SkiaManager {
  std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkManager> _skManager;
  std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkiOSPlatformContext> _platformContext;
  __weak ABI48_0_0RCTBridge* weakBridge;
}

- (std::shared_ptr<ABI48_0_0RNSkia::ABI48_0_0RNSkManager>) skManager {
  return _skManager;
}

- (void) invalidate {
  if(_skManager != nullptr) {
    _skManager->invalidate();
  }
  _skManager = nullptr;
  _platformContext = nullptr;
}

- (instancetype) initWithBridge:(ABI48_0_0RCTBridge*)bridge {
  self = [super init];
  if (self) {
    ABI48_0_0RCTCxxBridge *cxxBridge = (ABI48_0_0RCTCxxBridge *)bridge;
    if (cxxBridge.runtime) {

      auto callInvoker = bridge.jsCallInvoker;
      ABI48_0_0facebook::jsi::Runtime* jsRuntime = (ABI48_0_0facebook::jsi::Runtime*)cxxBridge.runtime;

      // Create platform context
      _platformContext = std::make_shared<ABI48_0_0RNSkia::ABI48_0_0RNSkiOSPlatformContext>(jsRuntime, callInvoker);

      // Create the ABI48_0_0RNSkiaManager (cross platform)
      _skManager = std::make_shared<ABI48_0_0RNSkia::ABI48_0_0RNSkManager>(jsRuntime, callInvoker, _platformContext);

    }
  }
  return self;
}

@end
