// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI42_0_0EXSensors/ABI42_0_0EXGyroscope.h>
#import <ABI42_0_0ExpoModulesCore/ABI42_0_0EXGyroscopeInterface.h>

@implementation ABI42_0_0EXGyroscope

ABI42_0_0UM_EXPORT_MODULE(ExponentGyroscope);

- (const NSString *)updateEventName
{
  return @"gyroscopeDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI42_0_0UMModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI42_0_0EXGyroscopeInterface)];
}

- (void)setUpdateInterval:(double)updateInterval onSensorService:(id)sensorService
{
  [sensorService setGyroscopeUpdateInterval:updateInterval];
}

- (BOOL)isAvailable:(id)sensorService
{
  return [sensorService isGyroAvailable];
}

- (void)subscribeToSensorService:(id)sensorService withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  [sensorService sensorModuleDidSubscribeForGyroscopeUpdates:self withHandler:handlerBlock];
}

- (void)unsubscribeFromSensorService:(id)sensorService
{
  [sensorService sensorModuleDidUnsubscribeForGyroscopeUpdates:self];
}

@end
