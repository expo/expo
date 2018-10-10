// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSensors/EXBaseSensorModule.h>

@protocol EXMagnetometerScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface EXMagnetometer : EXBaseSensorModule

@end

