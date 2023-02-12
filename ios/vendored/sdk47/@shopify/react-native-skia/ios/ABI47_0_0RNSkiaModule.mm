
#import "ABI47_0_0RNSkiaModule.h"
#import <ABI47_0_0React/ABI47_0_0RCTBridge+Private.h>

@implementation ABI47_0_0RNSkiaModule {
  ABI47_0_0SkiaManager* skiaManager;
}

ABI47_0_0RCT_EXPORT_MODULE(ABI47_0_0RNSkia)

#pragma Accessors

-(ABI47_0_0SkiaManager*) manager {
  return skiaManager;
}

#pragma Setup and invalidation

+ (BOOL)requiresMainQueueSetup {
  return YES;
}

- (void)invalidate
{
  if (skiaManager != nil) {
    [skiaManager invalidate];
  }
  skiaManager = nil;
}

ABI47_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
  if (skiaManager != nil) {
    // Already initialized, ignore call.
    return @true;
  }
  ABI47_0_0RCTBridge* bridge = [ABI47_0_0RCTBridge currentBridge];
  skiaManager = [[ABI47_0_0SkiaManager alloc] initWithBridge:bridge];
  return @true;
}

@end
