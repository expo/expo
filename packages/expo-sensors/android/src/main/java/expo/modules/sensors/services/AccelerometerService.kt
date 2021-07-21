// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import org.unimodules.core.interfaces.InternalModule

class AccelerometerService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, AccelerometerServiceInterface {
  public override fun getSensorType(): Int {
    return Sensor.TYPE_ACCELEROMETER
  }

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(AccelerometerServiceInterface::class.java)
  }
}