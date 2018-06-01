// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI28_0_0EXScopedEventEmitter.h"

static const float ABI28_0_0EXGravity = 9.81;

@protocol ABI28_0_0EXDeviceMotionScopedModuleDelegate

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI28_0_0EXDeviceMotion : ABI28_0_0EXScopedEventEmitter

@end
