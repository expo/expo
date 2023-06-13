
#import "ABI48_0_0RNSkiaModule.h"
#import <ABI48_0_0React/ABI48_0_0RCTBridge+Private.h>

@implementation ABI48_0_0RNSkiaModule {
  ABI48_0_0SkiaManager* skiaManager;
}

ABI48_0_0RCT_EXPORT_MODULE(ABI48_0_0RNSkia)

#pragma Accessors

-(ABI48_0_0SkiaManager*) manager {
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

ABI48_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
  if (skiaManager != nil) {
    // Already initialized, ignore call.
    return @true;
  }
  ABI48_0_0RCTBridge* bridge = [ABI48_0_0RCTBridge currentBridge];
  skiaManager = [[ABI48_0_0SkiaManager alloc] initWithBridge:bridge];
  return @true;
}

@end
