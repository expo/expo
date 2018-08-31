// Copyright © 2018 650 Industries. All rights reserved.

#import "ABI30_0_0EXSensorsManagerBinding.h"

@interface ABI30_0_0EXSensorsManagerBinding ()

@property (nonatomic, strong) NSString *experienceId;
@property (nonatomic, weak) id<ABI30_0_0EXSensorsManagerBindingDelegate> kernelService;

@end

@implementation ABI30_0_0EXSensorsManagerBinding

- (instancetype)initWithExperienceId:(NSString *)experienceId andKernelService:(id<ABI30_0_0EXSensorsManagerBindingDelegate>)kernelService
{
  if (self = [super init]) {
    _experienceId = experienceId;
    _kernelService = kernelService;
  }
  return self;
}

- (void)sensorModuleDidSubscribeForAccelerometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForAccelerometerUpdatesOfExperience:_experienceId withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForDeviceMotionUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForDeviceMotionUpdatesOfExperience:_experienceId withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForGyroscopeUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForGyroscopeUpdatesOfExperience:_experienceId withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForMagnetometerUncalibratedUpdatesOfExperience:_experienceId withHandler:handlerBlock];
}

- (void)sensorModuleDidSubscribeForMagnetometerUpdates:(id)scopedSensorModule withHandler:(void (^)(NSDictionary *))handlerBlock {
  [_kernelService sensorModuleDidSubscribeForMagnetometerUpdatesOfExperience:_experienceId withHandler:handlerBlock];
}

- (void)sensorModuleDidUnsubscribeForAccelerometerUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForAccelerometerUpdatesOfExperience:_experienceId];
}

- (void)sensorModuleDidUnsubscribeForDeviceMotionUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForDeviceMotionUpdatesOfExperience:_experienceId];
}

- (void)sensorModuleDidUnsubscribeForGyroscopeUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForGyroscopeUpdatesOfExperience:_experienceId];
}

- (void)sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdatesOfExperience:_experienceId];
}

- (void)sensorModuleDidUnsubscribeForMagnetometerUpdates:(id)scopedSensorModule {
  [_kernelService sensorModuleDidUnsubscribeForMagnetometerUpdatesOfExperience:_experienceId];
}

- (void)setAccelerometerUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setAccelerometerUpdateInterval:intervalMs];
}

- (void)setDeviceMotionUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setDeviceMotionUpdateInterval:intervalMs];
}

- (float)getGravity {
  return [_kernelService getGravity];
}


- (void)setGyroscopeUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setGyroscopeUpdateInterval:intervalMs];
}

- (void)setMagnetometerUncalibratedUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setMagnetometerUncalibratedUpdateInterval:intervalMs];
}

- (void)setMagnetometerUpdateInterval:(NSTimeInterval)intervalMs {
  [_kernelService setMagnetometerUpdateInterval:intervalMs];
}

+ (const NSArray<Protocol *> *)exportedInterfaces {
  return @[@protocol(ABI30_0_0EXAccelerometerInterface), @protocol(ABI30_0_0EXDeviceMotionInterface), @protocol(ABI30_0_0EXGyroscopeInterface), @protocol(ABI30_0_0EXMagnetometerInterface), @protocol(ABI30_0_0EXMagnetometerUncalibratedInterface)];
}

@end
