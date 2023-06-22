// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi49_0_0.expo.modules.interfaces.sensors.services.GyroscopeServiceInterface
import abi49_0_0.expo.modules.core.interfaces.InternalModule

class GyroscopeService(context: Context?) : SubscribableSensorService(context), InternalModule, GyroscopeServiceInterface {
  override val sensorType: Int = Sensor.TYPE_GYROSCOPE

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(GyroscopeServiceInterface::class.java)
  }
}
