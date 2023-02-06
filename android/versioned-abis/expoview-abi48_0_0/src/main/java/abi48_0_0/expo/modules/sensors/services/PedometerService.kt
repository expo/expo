// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi48_0_0.expo.modules.interfaces.sensors.services.PedometerServiceInterface
import abi48_0_0.expo.modules.core.interfaces.InternalModule

class PedometerService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, PedometerServiceInterface {
  override val sensorType: Int = Sensor.TYPE_STEP_COUNTER

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(PedometerServiceInterface::class.java)
  }
}
