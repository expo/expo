#import <ABI49_0_0RNReanimated/ABI49_0_0ReanimatedSensorType.h>

@interface ABI49_0_0ReanimatedSensorContainer : NSObject {
  NSNumber *_nextSensorId;
  NSMutableDictionary *_sensors;
}

- (instancetype)init;
- (int)registerSensor:(ABI49_0_0ReanimatedSensorType)sensorType
             interval:(int)interval
    iosReferenceFrame:(int)iosReferenceFrame
               setter:(void (^)(double[], int))setter;
- (void)unregisterSensor:(int)sensorId;

@end
