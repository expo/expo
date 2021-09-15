// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.MagnetometerServiceInterface
import expo.modules.core.interfaces.InternalModule

class MagnetometerService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, MagnetometerServiceInterface {
  override val sensorType: Int = Sensor.TYPE_MAGNETIC_FIELD

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(MagnetometerServiceInterface::class.java)
  }
}
