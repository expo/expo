// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXSensors/ABI48_0_0EXBarometer.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXBarometerInterface.h>

@implementation ABI48_0_0EXBarometer

ABI48_0_0EX_EXPORT_MODULE(ExpoBarometer);

- (const NSString *)updateEventName
{
  return @"barometerDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI48_0_0EXBarometerInterface)];
}

- (void)setUpdateInterval:(double)updateInterval onSensorService:(id)sensorService
{
  [sensorService setBarometerUpdateInterval:updateInterval];
}

- (BOOL)isAvailable:(id)sensorService
{
  return [sensorService isBarometerAvailable];
}

- (void)subscribeToSensorService:(id)sensorService withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  [sensorService sensorModuleDidSubscribeForBarometerUpdates:self withHandler:handlerBlock];
}

- (void)unsubscribeFromSensorService:(id)sensorService
{
  [sensorService sensorModuleDidUnsubscribeForBarometerUpdates:self];
}

@end
