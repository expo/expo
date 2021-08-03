// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.GravitySensorServiceInterface
import expo.modules.core.interfaces.InternalModule

class GravitySensorService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, GravitySensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_GRAVITY

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(GravitySensorServiceInterface::class.java)
  }
}
