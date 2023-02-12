#if __has_include(<CoreMotion/CoreMotion.h>)
#import <CoreMotion/CoreMotion.h>
#endif
#import <ABI47_0_0RNReanimated/ABI47_0_0ReanimatedSensorType.h>

@interface ABI47_0_0ReanimatedSensor : NSObject {
  ABI47_0_0ReanimatedSensorType _sensorType;
  double _interval;
  double _lastTimestamp;
#if !TARGET_OS_TV
  CMMotionManager *_motionManager;
#endif
  void (^_setter)(double[]);
}

- (instancetype)init:(ABI47_0_0ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter;
- (bool)initialize;
- (bool)initializeGyroscope;
- (bool)initializeAccelerometer;
- (bool)initializeGravity;
- (bool)initializeMagnetometer;
- (bool)initializeOrientation;
- (void)cancel;

@end
