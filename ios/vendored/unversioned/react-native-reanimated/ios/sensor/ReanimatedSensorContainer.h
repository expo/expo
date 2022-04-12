#import <RNReanimated/ReanimatedSensorType.h>

@interface ReanimatedSensorContainer : NSObject {
  NSNumber *_nextSensorId;
  NSMutableDictionary *_sensors;
}

- (instancetype)init;
- (int)registerSensor:(ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter;
- (void)unregisterSensor:(int)sensorId;

@end
