// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI24_0_0EXScopedEventEmitter.h"

static const float ABI24_0_0EXGravity = 9.81;

@protocol ABI24_0_0EXDeviceMotionScopedModuleDelegate

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI24_0_0EXDeviceMotion : ABI24_0_0EXScopedEventEmitter

@end
