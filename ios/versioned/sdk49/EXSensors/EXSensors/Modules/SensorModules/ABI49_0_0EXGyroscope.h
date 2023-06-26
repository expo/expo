// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI49_0_0EXSensors/ABI49_0_0EXBaseSensorModule.h>

@protocol ABI49_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI49_0_0EXGyroscope : ABI49_0_0EXBaseSensorModule

@end
