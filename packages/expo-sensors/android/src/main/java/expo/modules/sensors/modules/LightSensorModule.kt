// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy

private const val EventName = "lightSensorDidUpdate"

class LightSensorModule : Module() {
  private val sensorProxy by lazy {
    createSensorProxy(EventName, Sensor.TYPE_LIGHT, appContext) { sensorEvent ->
      Bundle().apply {
        putDouble("illuminance", sensorEvent.values[0].toDouble())
        putDouble("timestamp", sensorEvent.timestamp / 1_000_000_000.0)
      }
    }
  }

  override fun definition() = ModuleDefinition {
    Name("ExpoLightSensor")

    UseSensorProxy(this@LightSensorModule, Sensor.TYPE_LIGHT, EventName) { sensorProxy }
  }
}
