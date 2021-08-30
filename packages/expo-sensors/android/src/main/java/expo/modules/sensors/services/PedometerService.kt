// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.PedometerServiceInterface
import expo.modules.core.interfaces.InternalModule

class PedometerService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, PedometerServiceInterface {
  override val sensorType: Int = Sensor.TYPE_STEP_COUNTER

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(PedometerServiceInterface::class.java)
  }
}
