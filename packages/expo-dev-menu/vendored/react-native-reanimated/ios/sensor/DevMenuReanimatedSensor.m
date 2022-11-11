#import "DevMenuReanimatedSensor.h"

#if __has_include(<CoreMotion/CoreMotion.h>) && false
@implementation DevMenuReanimatedSensor

- (instancetype)init:(DevMenuReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter
{
  self = [super init];
  _sensorType = sensorType;
  if (interval == -1) {
    _interval = 1.0 / UIScreen.mainScreen.maximumFramesPerSecond;
  } else {
    _interval = interval / 1000.0; // in seconds
  }
  _setter = setter;
  _motionManager = [[CMMotionManager alloc] init];
  return self;
}

- (bool)initialize
{
  if (_sensorType == ACCELEROMETER) {
    return [self initializeAccelerometer];
  } else if (_sensorType == GYROSCOPE) {
    return [self initializeGyroscope];
  } else if (_sensorType == GRAVITY) {
    return [self initializeGravity];
  } else if (_sensorType == MAGNETIC_FIELD) {
    return [self initializeMagnetometer];
  } else if (_sensorType == ROTATION_VECTOR) {
    return [self initializeOrientation];
  }

  return false;
}

- (bool)initializeGyroscope
{
  if (![_motionManager isGyroAvailable]) {
    return false;
  }
  [_motionManager setGyroUpdateInterval:_interval];
  [_motionManager startGyroUpdates];
  [_motionManager
      startGyroUpdatesToQueue:[NSOperationQueue mainQueue]
                  withHandler:^(CMGyroData *sensorData, NSError *error) {
                    double currentTime = [[NSProcessInfo processInfo] systemUptime];
                    if (currentTime - self->_lastTimestamp < self->_interval) {
                      return;
                    }
                    double data[] = {sensorData.rotationRate.x, sensorData.rotationRate.y, sensorData.rotationRate.z};
                    self->_setter(data);
                    self->_lastTimestamp = currentTime;
                  }];

  return true;
}

- (bool)initializeAccelerometer
{
  if (![_motionManager isAccelerometerAvailable]) {
    return false;
  }
  [_motionManager setAccelerometerUpdateInterval:_interval];
  [_motionManager startAccelerometerUpdates];
  [_motionManager startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue]
                                       withHandler:^(CMAccelerometerData *sensorData, NSError *error) {
                                         double currentTime = [[NSProcessInfo processInfo] systemUptime];
                                         if (currentTime - self->_lastTimestamp < self->_interval) {
                                           return;
                                         }
                                         double G = 9.81;
                                         // convert G to m/s^2
                                         double data[] = {
                                             sensorData.acceleration.x * G,
                                             sensorData.acceleration.y * G,
                                             sensorData.acceleration.z * G};
                                         self->_setter(data);
                                         self->_lastTimestamp = currentTime;
                                       }];

  return true;
}

- (bool)initializeGravity
{
  if (![_motionManager isDeviceMotionAvailable]) {
    return false;
  }
  [_motionManager setDeviceMotionUpdateInterval:_interval];
  [_motionManager setShowsDeviceMovementDisplay:YES];
  [_motionManager
      startDeviceMotionUpdatesToQueue:[NSOperationQueue mainQueue]
                          withHandler:^(CMDeviceMotion *sensorData, NSError *error) {
                            double currentTime = [[NSProcessInfo processInfo] systemUptime];
                            if (currentTime - self->_lastTimestamp < self->_interval) {
                              return;
                            }
                            double G = 9.81;
                            // convert G to m/s^2
                            double data[] = {
                                sensorData.gravity.x * G, sensorData.gravity.y * G, sensorData.gravity.z * G};
                            self->_setter(data);
                            self->_lastTimestamp = currentTime;
                          }];

  return true;
}

- (bool)initializeMagnetometer
{
  if (![_motionManager isMagnetometerAvailable]) {
    return false;
  }
  [_motionManager setMagnetometerUpdateInterval:_interval];
  [_motionManager startMagnetometerUpdates];
  [_motionManager
      startMagnetometerUpdatesToQueue:[NSOperationQueue mainQueue]
                          withHandler:^(CMMagnetometerData *sensorData, NSError *error) {
                            double currentTime = [[NSProcessInfo processInfo] systemUptime];
                            if (currentTime - self->_lastTimestamp < self->_interval) {
                              return;
                            }
                            double data[] = {
                                sensorData.magneticField.x, sensorData.magneticField.y, sensorData.magneticField.z};
                            self->_setter(data);
                            self->_lastTimestamp = currentTime;
                          }];

  return true;
}

- (bool)initializeOrientation
{
  if (![_motionManager isDeviceMotionAvailable]) {
    return false;
  }
  [_motionManager setDeviceMotionUpdateInterval:_interval];

  [_motionManager setShowsDeviceMovementDisplay:YES];
  [_motionManager startDeviceMotionUpdatesUsingReferenceFrame:CMAttitudeReferenceFrameXArbitraryZVertical
                                                      toQueue:[NSOperationQueue mainQueue]
                                                  withHandler:^(CMDeviceMotion *sensorData, NSError *error) {
                                                    double currentTime = [[NSProcessInfo processInfo] systemUptime];
                                                    if (currentTime - self->_lastTimestamp < self->_interval) {
                                                      return;
                                                    }
                                                    CMAttitude *attitude = sensorData.attitude;
                                                    double data[] = {
                                                        attitude.quaternion.x,
                                                        attitude.quaternion.y,
                                                        attitude.quaternion.z,
                                                        attitude.quaternion.w,
                                                        attitude.yaw,
                                                        attitude.pitch,
                                                        attitude.roll};
                                                    self->_setter(data);
                                                    self->_lastTimestamp = currentTime;
                                                  }];

  return true;
}

- (void)cancel
{
  if (_sensorType == ACCELEROMETER) {
    [_motionManager stopAccelerometerUpdates];
  } else if (_sensorType == GYROSCOPE) {
    [_motionManager stopGyroUpdates];
  } else if (_sensorType == GRAVITY) {
    [_motionManager stopDeviceMotionUpdates];
  } else if (_sensorType == MAGNETIC_FIELD) {
    [_motionManager stopMagnetometerUpdates];
  } else if (_sensorType == ROTATION_VECTOR) {
    [_motionManager stopDeviceMotionUpdates];
  }
}

@end

#else

@implementation DevMenuReanimatedSensor

- (instancetype)init:(DevMenuReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter
{
  self = [super init];
  return self;
}

- (bool)initialize
{
  return false;
}

- (bool)initializeGyroscope
{
  return false;
}

- (bool)initializeAccelerometer
{
  return false;
}

- (bool)initializeGravity
{
  return false;
}

- (bool)initializeMagnetometer
{
  return false;
}

- (bool)initializeOrientation
{
  return false;
}

- (void)cancel
{
}

@end
#endif
