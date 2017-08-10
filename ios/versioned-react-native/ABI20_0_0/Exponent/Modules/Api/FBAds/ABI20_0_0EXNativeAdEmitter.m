#import "ABI20_0_0EXNativeAdEmitter.h"

@implementation ABI20_0_0EXNativeAdEmitter

ABI20_0_0RCT_EXPORT_MODULE(CTKNativeAdEmitter)

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"CTKNativeAdsManagersChanged"];
}

- (void)sendManagersState:(NSDictionary<NSString *,NSNumber *> *)adManagersState {
  [self sendEventWithName:@"CTKNativeAdsManagersChanged" body:adManagersState];
}

@end
