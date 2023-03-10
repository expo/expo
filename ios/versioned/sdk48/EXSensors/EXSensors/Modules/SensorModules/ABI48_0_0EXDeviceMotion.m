// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI48_0_0EXSensors/ABI48_0_0EXDeviceMotion.h>
#import <ABI48_0_0ExpoModulesCore/ABI48_0_0EXDeviceMotionInterface.h>

@implementation ABI48_0_0EXDeviceMotion

ABI48_0_0EX_EXPORT_MODULE(ExponentDeviceMotion);

- (NSDictionary *)constantsToExport
{
  if (self.sensorManager) {
    return @{ @"Gravity" : @([self.sensorManager getGravity]) };
  } else {
    return @{ @"Gravity" : [NSNull null] };
  }
}

- (const NSString *)updateEventName
{
  return @"deviceMotionDidUpdate";
}

- (id)getSensorServiceFromModuleRegistry:(ABI48_0_0EXModuleRegistry *)moduleRegistry
{
  return [moduleRegistry getModuleImplementingProtocol:@protocol(ABI48_0_0EXDeviceMotionInterface)];
}

- (void)setUpdateInterval:(double)updateInterval onSensorService:(id)sensorService
{
  [sensorService setDeviceMotionUpdateInterval:updateInterval];
}

- (BOOL)isAvailable:(id)sensorService
{
  return [sensorService isDeviceMotionAvailable];
}

- (void)subscribeToSensorService:(id)sensorService withHandler:(void (^)(NSDictionary *event))handlerBlock
{
  [sensorService sensorModuleDidSubscribeForDeviceMotionUpdates:self withHandler:handlerBlock];
}

- (void)unsubscribeFromSensorService:(id)sensorService
{
  [sensorService sensorModuleDidUnsubscribeForDeviceMotionUpdates:self];
}

@end
