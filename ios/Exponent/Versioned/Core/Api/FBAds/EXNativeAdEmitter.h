#import <React/RCTEventEmitter.h>

@interface EXNativeAdEmitter : RCTEventEmitter

- (void)sendManagersState:(NSDictionary<NSString *, NSNumber *> *)adManagersState;

@end
