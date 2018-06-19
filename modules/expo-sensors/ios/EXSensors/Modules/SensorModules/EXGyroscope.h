// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSensors/EXBaseSensorModule.h>

@protocol EXGyroscopeScopedModuleDelegate

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface EXGyroscope : EXBaseSensorModule

@end
