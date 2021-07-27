// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface
import expo.modules.core.interfaces.InternalModule

class RotationVectorSensorService(context: Context?) : SubscribableSensorService(context), InternalModule, RotationVectorSensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_ROTATION_VECTOR

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(RotationVectorSensorServiceInterface::class.java)
  }
}
