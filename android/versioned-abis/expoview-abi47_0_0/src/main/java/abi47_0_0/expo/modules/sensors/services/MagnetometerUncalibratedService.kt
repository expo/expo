// Copyright 2015-present 650 Industries. All rights reserved.
package abi47_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi47_0_0.expo.modules.interfaces.sensors.services.MagnetometerUncalibratedServiceInterface
import abi47_0_0.expo.modules.core.interfaces.InternalModule

class MagnetometerUncalibratedService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, MagnetometerUncalibratedServiceInterface {
  override val sensorType: Int = Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(MagnetometerUncalibratedServiceInterface::class.java)
  }
}
