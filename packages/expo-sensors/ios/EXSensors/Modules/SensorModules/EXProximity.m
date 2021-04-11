// Copyright 2015-present 650 Industries. All rights reserved.

#import <EXSensors/EXProximity.h>
#import <UMSensorsInterface/UMProximityInterface.h>

@implementation EXProximity

UM_EXPORT_MODULE(ExpoProximity);

- (const NSString *)updateEventName
{
  return @"proximityDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(UMModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(UMProximityInterface)];
}

- (BOOL)isAvailable:(id)sensorService
{
  return [sensorService isProximityAvailable];
}

- (void)subscribeToSensorService:(id)sensorService withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  [sensorService sensorModuleDidSubscribeForProximityUpdates:self withHandler:handlerBlock];
}

- (void)unsubscribeFromSensorService:(id)sensorService
{
  [sensorService sensorModuleDidUnsubscribeForProximityUpdates:self];
}

@end
