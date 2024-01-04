// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.sensors

import android.content.Context
import android.hardware.Sensor

class LinearAccelerationSensorKernelService(reactContext: Context) : SubscribableSensorKernelService(reactContext) {
  override val sensorType = Sensor.TYPE_LINEAR_ACCELERATION
}
