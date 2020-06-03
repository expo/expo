// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI38_0_0EXSensors/ABI38_0_0EXBaseSensorModule.h>

@protocol ABI38_0_0EXMagnetometerUncalibratedScopedModuleDelegate

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI38_0_0EXMagnetometerUncalibrated : ABI38_0_0EXBaseSensorModule

@end
