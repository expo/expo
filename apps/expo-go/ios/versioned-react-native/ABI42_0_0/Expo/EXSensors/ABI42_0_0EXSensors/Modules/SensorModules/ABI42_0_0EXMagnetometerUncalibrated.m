// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXSensors/ABI42_0_0EXMagnetometerUncalibrated.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXMagnetometerUncalibratedInterface.h>

@implementation ABI42_0_0EXMagnetometerUncalibrated

ABI42_0_0UM_EXPORT_MODULE(ExponentMagnetometerUncalibrated);

- (const NSString *)updateEventName
{
  return @"magnetometerUncalibratedDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXMagnetometerUncalibratedInterface)];
}

- (void)setUpdateInterval:(double)updateInterval onSensorService:(id)sensorService
{
  [sensorService setMagnetometerUncalibratedUpdateInterval:updateInterval];
}

- (BOOL)isAvailable:(id)sensorService
{
  return [sensorService isMagnetometerUncalibratedAvailable];
}

- (void)subscribeToSensorService:(id)sensorService withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  [sensorService sensorModuleDidSubscribeForMagnetometerUncalibratedUpdates:self withHandler:handlerBlock];
}

- (void)unsubscribeFromSensorService:(id)sensorService
{
  [sensorService sensorModuleDidUnsubscribeForMagnetometerUncalibratedUpdates:self];
}

@end
