#import <ABI48_0_0RNReanimated/ABI48_0_0ReanimatedSensorType.h>

@interface ABI48_0_0ReanimatedSensorContainer : NSObject {
  NSNumber *_nextSensorId;
  NSMutableDictionary *_sensors;
}

- (instancetype)init;
- (int)registerSensor:(ABI48_0_0ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter;
- (void)unregisterSensor:(int)sensorId;

@end
