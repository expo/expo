#import "SkiaManager.h"

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>

#import <ReactCommon/RCTTurboModule.h>

#import "RNSkiOSPlatformContext.h"

@implementation SkiaManager {
  std::shared_ptr<RNSkia::RNSkManager> _skManager;
  std::shared_ptr<RNSkia::RNSkiOSPlatformContext> _platformContext;
  __weak RCTBridge* weakBridge;
}

- (std::shared_ptr<RNSkia::RNSkManager>) skManager {
  return _skManager;
}

- (void) invalidate {
  if(_skManager != nullptr) {
    _skManager->invalidate();
  }
  _skManager = nullptr;
  _platformContext = nullptr;
}

- (instancetype) initWithBridge:(RCTBridge*)bridge {
  self = [super init];
  if (self) {
    RCTCxxBridge *cxxBridge = (RCTCxxBridge *)bridge;
    if (cxxBridge.runtime) {

      auto callInvoker = bridge.jsCallInvoker;
      facebook::jsi::Runtime* jsRuntime = (facebook::jsi::Runtime*)cxxBridge.runtime;

      // Create platform context
      _platformContext = std::make_shared<RNSkia::RNSkiOSPlatformContext>(jsRuntime, callInvoker);

      // Create the RNSkiaManager (cross platform)
      _skManager = std::make_shared<RNSkia::RNSkManager>(jsRuntime, callInvoker, _platformContext);

    }
  }
  return self;
}

@end
