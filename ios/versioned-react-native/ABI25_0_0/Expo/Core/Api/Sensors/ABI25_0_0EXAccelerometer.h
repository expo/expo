#import <CoreMotion/CoreMotion.h>
#import <ReactABI25_0_0/ABI25_0_0RCTBridge.h>
#import "ABI25_0_0EXScopedEventEmitter.h"

@protocol ABI25_0_0EXAccelerometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI25_0_0EXAccelerometer : ABI25_0_0EXScopedEventEmitter

@end
