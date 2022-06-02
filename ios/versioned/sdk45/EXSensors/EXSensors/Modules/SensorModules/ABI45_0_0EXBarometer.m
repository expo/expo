// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI45_0_0EXSensors/ABI45_0_0EXBarometer.h>
#import <ABI45_0_0ExpoModulesCore/ABI45_0_0EXBarometerInterface.h>

@implementation ABI45_0_0EXBarometer

ABI45_0_0EX_EXPORT_MODULE(ExpoBarometer);

- (const NSString *)updateEventName
{
  return @"barometerDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI45_0_0EXModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI45_0_0EXBarometerInterface)];
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
