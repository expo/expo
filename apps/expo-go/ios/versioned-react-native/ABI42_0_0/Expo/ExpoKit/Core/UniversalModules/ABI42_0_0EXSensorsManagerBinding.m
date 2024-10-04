// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI42_0_0EXSensorsManagerBinding.h"

@interface ABI42_0_0EXSensorsManagerBinding ()

@property (nonatomic, strong) NSString *scopeKey;
@property (nonatomic, weak) id<ABI42_0_0EXSensorsManagerBindingDelegate> kernelService;

@end

@implementation ABI42_0_0EXSensorsManagerBinding

- (instancetype)initWithScopeKey:(NSString *)scopeKey andKernelService:(id<ABI42_0_0EXSensorsManagerBindingDelegate>)kernelService
{
  if (self = [super init]) {
    _scopeKey = scopeKey;
    _kernelService = kernelService;
  }
  return self;
}

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForAccelerometerUpdatesOfExperience:_scopeKey withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForDeviceMotionUpdatesOfExperience:_scopeKey withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForGyroscopeUpdatesOfExperience:_scopeKey withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForMagnetometerUncalibratedUpdatesOfExperience:_scopeKey withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForMagnetometerUpdatesOfExperience:_scopeKey withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForBarometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForBarometerUpdatesOfExperience:_scopeKey withHandler:handlerBlock];
}

- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForAccelerometerUpdatesOfExperience:_scopeKey];
}

- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForDeviceMotionUpdatesOfExperience:_scopeKey];
}

- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:_scopeKey];
}

- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdatesOfExperience:_scopeKey];
}

- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForMagnetometerUpdatesOfExperience:_scopeKey];
}

- (void)sensorModuleDidUnsubscribeForBarometerUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForBarometerUpdatesOfExperience:_scopeKey];
}

- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setAccelerometerUpdateInterval:intervalMs];
}

- (BOOL)isAccelerometerAvailable {
  return [_kernelService isAccelerometerAvailable];
}

- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setDeviceMotionUpdateInterval:intervalMs];
}

- (float)getGravity {
  return [_kernelService getGravity];
}

- (BOOL)isDeviceMotionAvailable {
  return [_kernelService isDeviceMotionAvailable];
}

- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setGyroscopeUpdateInterval:intervalMs];
}

- (BOOL)isGyroAvailable {
  return [_kernelService isGyroAvailable];
}

- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setMagnetometerUncalibratedUpdateInterval:intervalMs];
}

- (BOOL)isMagnetometerUncalibratedAvailable {
  return [_kernelService isMagnetometerUncalibratedAvailable];
}

- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setMagnetometerUpdateInterval:intervalMs];
}

- (BOOL)isMagnetometerAvailable {
  return [_kernelService isMagnetometerAvailable];
}

- (void)setBarometerUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setBarometerUpdateInterval:intervalMs];
}

- (BOOL)isBarometerAvailable {
  return [_kernelService isBarometerAvailable];
}


+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI42_0_0EXAccelerometerInterface), @protocol(ABI42_0_0EXBarometerInterface),  @protocol(ABI42_0_0EXDeviceMotionInterface), @protocol(ABI42_0_0EXGyroscopeInterface), @protocol(ABI42_0_0EXMagnetometerInterface), @protocol(ABI42_0_0EXMagnetometerUncalibratedInterface)];
}

@end
