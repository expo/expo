// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI26_0_0EXScopedEventEmitter.h"

static const float ABI26_0_0EXGravity = 9.81;

@protocol ABI26_0_0EXDeviceMotionScopedModuleDelegate

- (void)sensorModuleDidSubscribeForDeviceMotionUpdatesOfExperience:(NSString *)experienceId withHandler:(void (^)(NSDictionary *event))handlerBlock;
- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdatesOfExperience:(NSString *)experienceId;
- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs;

@end

@interface ABI26_0_0EXDeviceMotion : ABI26_0_0EXScopedEventEmitter

@end
