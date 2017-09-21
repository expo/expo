// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXScopedEventEmitter.h"

static const float EXGravity = 9.81;

@protocol EXDeviceMotionScopedModuleDelegate

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface EXDeviceMotion : EXScopedEventEmitter

@end
