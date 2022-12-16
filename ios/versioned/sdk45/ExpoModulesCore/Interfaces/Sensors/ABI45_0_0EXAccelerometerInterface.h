// Copyright 2018-present 650 Industries. All rights reserved.

@protocol ABI45_0_0EXAccelerometerInterface

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule;
- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs;
- (BOOL)isAccelerometerAvailable;

@end
