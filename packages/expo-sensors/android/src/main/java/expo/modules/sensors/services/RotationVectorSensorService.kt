// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import expo.modules.interfaces.sensors.services.RotationVectorSensorServiceInterface
import org.unimodules.core.interfaces.InternalModule

class RotationVectorSensorService(context: Context?) : SubscribableSensorService(context), InternalModule, RotationVectorSensorServiceInterface {
  public override fun getSensorType(): Int {
    return Sensor.TYPE_ROTATION_VECTOR
  }

  override fun getExportedInterfaces(): List<Class<*>> {
    return listOf<Class<*>>(RotationVectorSensorServiceInterface::class.java)
  }
}