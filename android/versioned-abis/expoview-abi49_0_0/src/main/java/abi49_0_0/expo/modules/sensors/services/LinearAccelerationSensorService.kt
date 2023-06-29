// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi49_0_0.expo.modules.interfaces.sensors.services.LinearAccelerationSensorServiceInterface
import abi49_0_0.expo.modules.core.interfaces.InternalModule

class LinearAccelerationSensorService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, LinearAccelerationSensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_LINEAR_ACCELERATION

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(LinearAccelerationSensorServiceInterface::class.java)
  }
}
