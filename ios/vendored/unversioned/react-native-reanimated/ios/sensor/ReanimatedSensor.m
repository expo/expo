#import <RNReanimated/ReanimatedSensor.h>

#if __has_include(<CoreMotion/CoreMotion.h>)
@implementation ReanimatedSensor

- (instancetype)init:(ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter
{
  self = [super init];
  _sensorType = sensorType;
  _interval = interval / 1000; // in seconds
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
  [_motionManager
      startAccelerometerUpdatesToQueue:[NSOperationQueue mainQueue]
                           withHandler:^(CMAccelerometerData *sensorData, NSError *error) {
                             double currentTime = [[NSProcessInfo processInfo] systemUptime];
                             if (currentTime - self->_lastTimestamp < self->_interval) {
                               return;
                             }
                             double data[] = {
                                 sensorData.acceleration.x, sensorData.acceleration.y, sensorData.acceleration.z};
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
                            double data[] = {sensorData.gravity.x, sensorData.gravity.y, sensorData.gravity.z};
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
  [_motionManager startDeviceMotionUpdatesUsingReferenceFrame:CMAttitudeReferenceFrameXTrueNorthZVertical
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
                                                        attitude.roll
                                                    };
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

@implementation ReanimatedSensor

- (instancetype)init:(ReanimatedSensorType)sensorType interval:(int)interval setter:(void (^)(double[]))setter
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
