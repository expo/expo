// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.sensors

import android.content.Context
import android.hardware.Sensor

class RotationVectorSensorKernelService(context: Context) : SubscribableSensorKernelService(context) {
  override val sensorType = Sensor.TYPE_ROTATION_VECTOR
}
