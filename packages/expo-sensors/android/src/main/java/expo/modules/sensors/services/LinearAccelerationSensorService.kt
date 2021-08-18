// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.LinearAccelerationSensorServiceInterface
import expo.modules.core.interfaces.InternalModule

class LinearAccelerationSensorService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, LinearAccelerationSensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_LINEAR_ACCELERATION

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(LinearAccelerationSensorServiceInterface::class.java)
  }
}
