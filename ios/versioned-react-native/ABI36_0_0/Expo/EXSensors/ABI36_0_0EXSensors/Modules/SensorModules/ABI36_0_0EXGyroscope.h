// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0EXSensors/ABI36_0_0EXBaseSensorModule.h>

@protocol ABI36_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI36_0_0EXGyroscope : ABI36_0_0EXBaseSensorModule

@end
