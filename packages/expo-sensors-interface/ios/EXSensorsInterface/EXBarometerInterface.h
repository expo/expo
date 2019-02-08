// Copyright 2018-present 650 Industries. All rights reserved.

@protocol EXBarometerInterface

- (void)sensorModuleDidSubscribeForBarometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForBarometerUpdates:(id)scopedSensorModule;
- (void)setBarometerUpdateInterval:(NSTimeInterval)intervalMs;
- (BOOL)isBarometerAvailable;

@end
