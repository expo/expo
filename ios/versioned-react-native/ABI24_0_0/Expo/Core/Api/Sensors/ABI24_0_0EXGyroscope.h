#import <CoreMotion/CoreMotion.h>
#import <ReactABI24_0_0/ABI24_0_0RCTBridge.h>
#import "ABI24_0_0EXScopedEventEmitter.h"

@protocol ABI24_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI24_0_0EXGyroscope : ABI24_0_0EXScopedEventEmitter

@end
