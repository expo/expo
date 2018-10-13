module.exports = {
  get Accelerometer() {
    return require('./sensor/Accelerometer').default;
  },
  get DeviceMotion() {
    return require('./sensor/DeviceMotion').default;
  },
  get Gyroscope() {
    return require('./sensor/Gyroscope').default;
  },
  get Magnetometer() {
    return require('./sensor/Magnetometer').default;
  },
  get MagnetometerUncalibrated() {
    return require('./sensor/MagnetometerUncalibrated').default;
  },
  get Pedometer() {
    return require('./sensor/Pedometer');
  },
};
