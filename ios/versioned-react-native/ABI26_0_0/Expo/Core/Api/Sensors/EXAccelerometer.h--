#import <CoreMotion/CoreMotion.h>
#import <ReactABI26_0_0/ABI26_0_0RCTBridge.h>
#import "ABI26_0_0EXScopedEventEmitter.h"

@protocol ABI26_0_0EXAccelerometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI26_0_0EXAccelerometer : ABI26_0_0EXScopedEventEmitter

@end
