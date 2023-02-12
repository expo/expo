// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXSensors/ABI48_0_0EXBaseSensorModule.h>

@protocol ABI48_0_0EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI48_0_0EXMagnetometer : ABI48_0_0EXBaseSensorModule

@end

