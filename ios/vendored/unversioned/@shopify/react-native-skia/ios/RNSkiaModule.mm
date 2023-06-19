
#import "RNSkiaModule.h"
#import <React/RCTBridge+Private.h>

@implementation RNSkiaModule {
  SkiaManager *skiaManager;
}

RCT_EXPORT_MODULE(RNSkia)

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

@end
