// Copyright 2018-present 650 Industries. All rights reserved.

@protocol UMProximityInterface

- (void)sensorModuleDidSubscribeForProximityUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForProximityUpdates:(id)scopedSensorModule;
- (BOOL)isProximityAvailable;

@end
