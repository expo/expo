// Copyright 2015-present 650 Industries. All rights reserved.
package abi47_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi47_0_0.expo.modules.interfaces.sensors.services.GravitySensorServiceInterface
import abi47_0_0.expo.modules.core.interfaces.InternalModule

class GravitySensorService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, GravitySensorServiceInterface {
  override val sensorType: Int = Sensor.TYPE_GRAVITY

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(GravitySensorServiceInterface::class.java)
  }
}
