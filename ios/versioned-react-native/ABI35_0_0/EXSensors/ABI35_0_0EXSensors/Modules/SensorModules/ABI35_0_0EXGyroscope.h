// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXSensors/ABI35_0_0EXBaseSensorModule.h>

@protocol ABI35_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI35_0_0EXGyroscope : ABI35_0_0EXBaseSensorModule

@end
