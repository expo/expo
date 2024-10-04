// Copyright 2018-present 650 Industries. All rights reserved.

@protocol ABI42_0_0EXMagnetometerUncalibratedInterface

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule
                                                       withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule;
- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs;
- (BOOL)isMagnetometerUncalibratedAvailable;

@end
