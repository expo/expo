
#import "ABI46_0_0RNSkiaModule.h"
#import <ABI46_0_0React/ABI46_0_0RCTBridge+Private.h>

@implementation ABI46_0_0RNSkiaModule {
  ABI46_0_0SkiaManager* skiaManager;
}

ABI46_0_0RCT_EXPORT_MODULE(ABI46_0_0RNSkia)

#pragma Accessors

-(ABI46_0_0SkiaManager*) manager {
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

ABI46_0_0RCT_EXPORT_BLOCKING_SYNCHRONOUS_METHOD(install)
{
  if (skiaManager != nil) {
    // Already initialized, ignore call.
    return @true;
  }
  ABI46_0_0RCTBridge* bridge = [ABI46_0_0RCTBridge currentBridge];
  skiaManager = [[ABI46_0_0SkiaManager alloc] initWithBridge:bridge];
  return @true;
}

@end
