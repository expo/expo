#import "DevMenuReanimatedSensorType.h"

@interface DevMenuReanimatedSensorContainer : NSObject {
  NSNumber *_nextSensorId;
  NSMutableDictionary *_sensors;
}

- (instancetype)init;
- (int)registerSensor:(DevMenuReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter;
- (void)unregisterSensor:(int)sensorId;

@end
