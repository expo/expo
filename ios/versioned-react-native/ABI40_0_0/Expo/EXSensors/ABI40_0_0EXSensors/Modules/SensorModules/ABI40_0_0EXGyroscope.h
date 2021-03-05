// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI40_0_0EXSensors/ABI40_0_0EXBaseSensorModule.h>

@protocol ABI40_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI40_0_0EXGyroscope : ABI40_0_0EXBaseSensorModule

@end
