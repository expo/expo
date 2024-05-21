// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy

private const val EventName = "barometerDidUpdate"

class BarometerModule : Module() {
  private val sensorProxy by lazy {
    createSensorProxy(EventName, Sensor.TYPE_PRESSURE, appContext) { sensorEvent ->
      Bundle().apply {
        // TODO: Bacon: Can we get relative altitude?
        putDouble("pressure", sensorEvent.values[0].toDouble())
        putDouble("timestamp", sensorEvent.timestamp / 1_000_000_000.0)
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoBarometer")

    UseSensorProxy(this@BarometerModule, Sensor.TYPE_PRESSURE, EventName) { sensorProxy }
  }
}
