// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import abi49_0_0.expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import abi49_0_0.expo.modules.core.interfaces.InternalModule

class AccelerometerService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, AccelerometerServiceInterface {
  override val sensorType: Int = Sensor.TYPE_ACCELEROMETER

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(AccelerometerServiceInterface::class.java)
  }
}
