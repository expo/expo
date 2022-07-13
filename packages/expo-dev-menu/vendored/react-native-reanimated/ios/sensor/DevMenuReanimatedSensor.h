// TODO(@lukmccall): reanable when `Undefined symbols for architecture x86_64: "_OBJC_CLASS_$_CMMotionManager"` error in tests is fixed
#if __has_include(<CoreMotion/CoreMotion.h>) && false
#import <CoreMotion/CoreMotion.h>
#endif
#import "DevMenuReanimatedSensorType.h"

@interface DevMenuReanimatedSensor : NSObject {
  DevMenuReanimatedSensorType _sensorType;
  double _interval;
  double _lastTimestamp;
#if !TARGET_OS_TV && false
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
