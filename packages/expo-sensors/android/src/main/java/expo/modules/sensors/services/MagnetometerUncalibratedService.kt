// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.MagnetometerUncalibratedServiceInterface
import org.unimodules.core.interfaces.InternalModule

class MagnetometerUncalibratedService(reactContext: Context?) : SubscribableSensorService(reactContext), InternalModule, MagnetometerUncalibratedServiceInterface {
  public override fun getSensorType(): Int {
    return Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED
  }

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(MagnetometerUncalibratedServiceInterface::class.java)
  }
}