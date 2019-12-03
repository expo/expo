// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXSensors/ABI35_0_0EXBaseSensorModule.h>

@protocol ABI35_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI35_0_0EXMagnetometer : ABI35_0_0EXBaseSensorModule

@end

