// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI31_0_0EXSensors/ABI31_0_0EXBaseSensorModule.h>

@protocol ABI31_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI31_0_0EXMagnetometerUncalibrated : ABI31_0_0EXBaseSensorModule

@end
