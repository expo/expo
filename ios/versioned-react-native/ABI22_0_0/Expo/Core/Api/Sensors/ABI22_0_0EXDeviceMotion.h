// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI22_0_0EXScopedEventEmitter.h"

static const float ABI22_0_0EXGravity = 9.81;

@protocol ABI22_0_0EXDeviceMotionScopedModuleDelegate

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI22_0_0EXDeviceMotion : ABI22_0_0EXScopedEventEmitter

@end
