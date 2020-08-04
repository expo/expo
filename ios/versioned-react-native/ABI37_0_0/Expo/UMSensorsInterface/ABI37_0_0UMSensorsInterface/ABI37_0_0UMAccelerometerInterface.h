// Copyright 2018-present 650 Industries. All rights reserved.

@protocol ABI37_0_0UMAccelerometerInterface

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;
- (BOOL)isAccelerometerAvailable;

@end
