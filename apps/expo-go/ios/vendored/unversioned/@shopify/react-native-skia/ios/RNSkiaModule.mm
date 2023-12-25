
#import "RNSkiaModule.h"
#import <React/RCTBridge+Private.h>

@implementation RNSkiaModule {
  SkiaManager *skiaManager;
}

RCT_EXPORT_MODULE()

#pragma Accessors

- (SkiaManager *)manager {
  return skiaManager;
}

#pragma Setup and invalidation

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)invalidate {
  if (skiaManager != nil) {
    [skiaManager invalidate];
  }
  skiaManager = nil;
}

RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install) {
  if (skiaManager != nil) {
    // Already initialized, ignore call.
    return @true;
  }
  RCTBridge *bridge = [RCTBridge currentBridge];
  skiaManager = [[SkiaManager alloc] initWithBridge:bridge];
  return @true;
}

#ifdef RCT_NEW_ARCH_ENABLED
- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
  return std::make_shared<facebook::react::NativeSkiaModuleSpecJSI>(params);
}
#endif

@end
