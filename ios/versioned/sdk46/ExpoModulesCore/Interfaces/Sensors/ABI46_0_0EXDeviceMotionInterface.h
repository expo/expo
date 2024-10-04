// Copyright 2018-present 650 Industries. All rights reserved.

@protocol ABI46_0_0EXDeviceMotionInterface

- (float)getGravity;
- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;
- (BOOL)isDeviceMotionAvailable;

@end
