// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXSensors/ABI37_0_0EXAccelerometer.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMAccelerometerInterface.h>

@implementation ABI37_0_0EXAccelerometer

ABI37_0_0UM_EXPORT_MODULE(ExponentAccelerometer);

- (const NSString *)updateEventName
{
  return @"accelerometerDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMAccelerometerInterface)];
}

- (void)setUpdateInterval:(double)updateInterval onSensorService:(id)sensorService
{
  [sensorService setAccelerometerUpdateInterval:updateInterval];
}

- (BOOL)isAvailable:(id)sensorService
{
  return [sensorService isAccelerometerAvailable];
}

- (void)subscribeToSensorService:(id)sensorService withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  [sensorService sensorModuleDidSubscribeForAccelerometerUpdates:self withHandler:handlerBlock];
}

- (void)unsubscribeFromSensorService:(id)sensorService
{
  [sensorService sensorModuleDidUnsubscribeForAccelerometerUpdates:self];
}

@end
