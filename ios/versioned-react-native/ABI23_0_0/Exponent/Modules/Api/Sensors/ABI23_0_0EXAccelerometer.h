#import <CoreMotion/CoreMotion.h>
#import <ReactABI23_0_0/ABI23_0_0RCTBridge.h>
#import "ABI23_0_0EXScopedEventEmitter.h"

@protocol ABI23_0_0EXAccelerometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI23_0_0EXAccelerometer : ABI23_0_0EXScopedEventEmitter

@end
