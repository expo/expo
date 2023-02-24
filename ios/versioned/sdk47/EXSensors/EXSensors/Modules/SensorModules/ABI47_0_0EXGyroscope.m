// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI47_0_0EXSensors/ABI47_0_0EXGyroscope.h>
#import <ABI47_0_0ExpoModulesCore/ABI47_0_0EXGyroscopeInterface.h>

@implementation ABI47_0_0EXGyroscope

ABI47_0_0EX_EXPORT_MODULE(ExponentGyroscope);

- (const NSString *)updateEventName
{
  return @"gyroscopeDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI47_0_0EXModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI47_0_0EXGyroscopeInterface)];
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
