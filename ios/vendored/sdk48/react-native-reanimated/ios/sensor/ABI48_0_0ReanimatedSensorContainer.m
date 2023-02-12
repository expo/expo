#import <Foundation/Foundation.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0ReanimatedSensor.h>
#import <ABI48_0_0RNReanimated/ABI48_0_0ReanimatedSensorContainer.h>

static NSNumber *_nextSensorId = nil;

@implementation ABI48_0_0ReanimatedSensorContainer

- (instancetype)init
{
  self = [super init];
  _sensors = [[NSMutableDictionary alloc] init];
  _nextSensorId = @0;
  return self;
}

- (int)registerSensor:(ABI48_0_0ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter
{
  ABI48_0_0ReanimatedSensor *sensor = [[ABI48_0_0ReanimatedSensor alloc] init:sensorType interval:interval setter:setter];
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
