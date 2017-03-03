#import <React/RCTEventEmitter.h>

@interface CTKNativeAdEmitter : RCTEventEmitter

- (void)sendManagersState:(NSDictionary<NSString *, NSNumber *> *)adManagersState;

@end
