#import <ABI47_0_0SkiaManager.h>

#import <Foundation/Foundation.h>

#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>

#import <ABI47_0_0ReactCommon/ABI47_0_0RCTTurboModule.h>

#import "ABI47_0_0RNSkiOSPlatformContext.h"

@implementation ABI47_0_0SkiaManager {
  std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkManager> _skManager;
  std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkiOSPlatformContext> _platformContext;
  __weak ABI47_0_0RCTBridge* weakBridge;
}

- (std::shared_ptr<ABI47_0_0RNSkia::ABI47_0_0RNSkManager>) skManager {
  return _skManager;
}

- (void) invalidate {
  if(_skManager != nullptr) {
    _skManager->invalidate();
  }
  _skManager = nullptr;
  _platformContext = nullptr;
}

- (instancetype) initWithBridge:(ABI47_0_0RCTBridge*)bridge {
  self = [super init];
  if (self) {
    ABI47_0_0RCTCxxBridge *cxxBridge = (ABI47_0_0RCTCxxBridge *)bridge;
    if (cxxBridge.runtime) {
      
      auto callInvoker = bridge.jsCallInvoker;
      ABI47_0_0facebook::jsi::Runtime* jsRuntime = (ABI47_0_0facebook::jsi::Runtime*)cxxBridge.runtime;
      
      // Create platform context
      _platformContext = std::make_shared<ABI47_0_0RNSkia::ABI47_0_0RNSkiOSPlatformContext>(jsRuntime, callInvoker);
            
      // Create the ABI47_0_0RNSkiaManager (cross platform)
      _skManager = std::make_shared<ABI47_0_0RNSkia::ABI47_0_0RNSkManager>(jsRuntime, callInvoker, _platformContext);
          
    }
  }
  return self;
}

@end
