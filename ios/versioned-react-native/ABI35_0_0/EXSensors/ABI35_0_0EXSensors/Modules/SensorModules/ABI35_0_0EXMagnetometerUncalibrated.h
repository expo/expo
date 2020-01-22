// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI35_0_0EXSensors/ABI35_0_0EXBaseSensorModule.h>

@protocol ABI35_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI35_0_0EXMagnetometerUncalibrated : ABI35_0_0EXBaseSensorModule

@end
