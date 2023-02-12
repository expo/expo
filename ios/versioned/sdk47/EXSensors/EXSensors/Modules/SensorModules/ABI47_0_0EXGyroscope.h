// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXSensors/ABI47_0_0EXBaseSensorModule.h>

@protocol ABI47_0_0EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI47_0_0EXGyroscope : ABI47_0_0EXBaseSensorModule

@end
