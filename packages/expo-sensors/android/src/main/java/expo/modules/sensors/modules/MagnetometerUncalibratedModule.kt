// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy

private const val EventName = "magnetometerUncalibratedDidUpdate"

class MagnetometerUncalibratedModule : Module() {
  private val sensorProxy by lazy {
    createSensorProxy(EventName, Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED, appContext) { sensorEvent ->
      Bundle().apply {
        putDouble("x", sensorEvent.values[0].toDouble())
        putDouble("y", sensorEvent.values[1].toDouble())
        putDouble("z", sensorEvent.values[2].toDouble())
        putDouble("timestamp", sensorEvent.timestamp / 1_000_000_000.0)
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExponentMagnetometerUncalibrated")

    UseSensorProxy(this@MagnetometerUncalibratedModule, Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED, EventName) { sensorProxy }
  }
}
