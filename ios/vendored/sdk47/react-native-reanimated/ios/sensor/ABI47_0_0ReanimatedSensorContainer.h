#import <ABI47_0_0RNReanimated/ABI47_0_0ReanimatedSensorType.h>

@interface ABI47_0_0ReanimatedSensorContainer : NSObject {
  NSNumber *_nextSensorId;
  NSMutableDictionary *_sensors;
}

- (instancetype)init;
- (int)registerSensor:(ABI47_0_0ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter;
- (void)unregisterSensor:(int)sensorId;

@end
