#import <Foundation/Foundation.h>
#import "DevMenuReanimatedSensor.h"
#import "DevMenuReanimatedSensorContainer.h"

static NSNumber *_nextSensorId = nil;

@implementation DevMenuReanimatedSensorContainer

- (instancetype)init
{
  self = [super init];
  _sensors = [[NSMutableDictionary alloc] init];
  _nextSensorId = @0;
  return self;
}

- (int)registerSensor:(DevMenuReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter
{
  DevMenuReanimatedSensor *sensor = [[DevMenuReanimatedSensor alloc] init:sensorType interval:interval setter:setter];
  if ([sensor initialize]) {
    NSNumber *sensorId = [_nextSensorId copy];
    _nextSensorId = [NSNumber numberWithInt:[_nextSensorId intValue] + 1];
    [_sensors setObject:sensor forKey:sensorId];
    return [sensorId intValue];
  } else {
    return -1;
  }
}

- (void)unregisterSensor:(int)sensorId
{
  NSNumber *_sensorId = [NSNumber numberWithInt:sensorId];
  if (_sensors[_sensorId] == nil) {
    return;
  }
  [_sensors[_sensorId] cancel];
  [_sensors removeObjectForKey:_sensorId];
}

@end
