// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.GyroscopeServiceInterface
import expo.modules.core.interfaces.InternalModule

class GyroscopeService(context: Context?) : SubscribableSensorService(context), InternalModule, GyroscopeServiceInterface {
  override val sensorType: Int = Sensor.TYPE_GYROSCOPE

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(GyroscopeServiceInterface::class.java)
  }
}
