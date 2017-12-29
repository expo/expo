#import <CoreMotion/CoreMotion.h>
#import <React/RCTBridge.h>
#import "EXScopedEventEmitter.h"

@protocol EXAccelerometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface EXAccelerometer : EXScopedEventEmitter

@end
