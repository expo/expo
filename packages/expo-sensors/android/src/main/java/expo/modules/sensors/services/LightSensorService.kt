// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.LightSensorServiceInterface
import expo.modules.core.interfaces.InternalModule

class LightSensorService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, LightSensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_LIGHT

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(LightSensorServiceInterface::class.java)
  }
}
