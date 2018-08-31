// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI30_0_0EXSensors/ABI30_0_0EXBaseSensorModule.h>

@protocol ABI30_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI30_0_0EXMagnetometer : ABI30_0_0EXBaseSensorModule

@end

