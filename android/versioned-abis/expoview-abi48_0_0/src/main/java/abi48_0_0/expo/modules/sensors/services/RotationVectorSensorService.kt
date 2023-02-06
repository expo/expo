// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi48_0_0.expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface
import abi48_0_0.expo.modules.core.interfaces.InternalModule

class RotationVectorSensorService(context: Context?) : SubscribableSensorService(context), InternalModule, RotationVectorSensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_ROTATION_VECTOR

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(RotationVectorSensorServiceInterface::class.java)
  }
}
