#import <CoreMotion/CoreMotion.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import "ABI25_0_0EXScopedEventEmitter.h"

@protocol ABI25_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI25_0_0EXGyroscope : ABI25_0_0EXScopedEventEmitter

@end
