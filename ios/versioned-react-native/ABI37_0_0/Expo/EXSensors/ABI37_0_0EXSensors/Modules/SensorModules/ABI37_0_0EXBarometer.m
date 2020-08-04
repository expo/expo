// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI37_0_0EXSensors/ABI37_0_0EXBarometer.h>
#import <ABI37_0_0UMSensorsInterface/ABI37_0_0UMBarometerInterface.h>

@implementation ABI37_0_0EXBarometer

ABI37_0_0UM_EXPORT_MODULE(ExpoBarometer);

- (const NSString *)updateEventName
{
  return @"barometerDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI37_0_0UMModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI37_0_0UMBarometerInterface)];
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
