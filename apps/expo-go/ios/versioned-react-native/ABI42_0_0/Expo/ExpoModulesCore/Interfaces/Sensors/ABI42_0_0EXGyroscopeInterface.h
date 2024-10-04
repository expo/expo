// Copyright 2018-present 650 Industries. All rights reserved.

@protocol ABI42_0_0EXGyroscopeInterface

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule;
- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs;
- (BOOL)isGyroAvailable;

@end
