#if __has_include(<CoreMotion/CoreMotion.h>)
#import <CoreMotion/CoreMotion.h>
#endif
#import "DevMenuReanimatedSensorType.h"

@interface DevMenuReanimatedSensor : NSObject {
  DevMenuReanimatedSensorType _sensorType;
  double _interval;
  double _lastTimestamp;
#if !TARGET_OS_TV
  CMMotionManager *_motionManager;
#endif
  void (^_setter)(double[]);
}

- (instancetype)init:(DevMenuReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter;
- (bool)initialize;
- (bool)initializeGyroscope;
- (bool)initializeAccelerometer;
- (bool)initializeGravity;
- (bool)initializeMagnetometer;
- (bool)initializeOrientation;
- (void)cancel;

@end
