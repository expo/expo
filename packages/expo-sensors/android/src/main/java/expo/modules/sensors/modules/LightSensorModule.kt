// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import expo.modules.sensors.LightSensorEvent
import expo.modules.sensors.SensorProxy
import expo.modules.sensors.startObserving
import expo.modules.sensors.stopObserving
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.react.androidContext

@ExpoModule("ExpoLightSensor")
class LightSensorModule : Module() {
  private val sensorProxy: SensorProxy = SensorProxy(Sensor.TYPE_LIGHT, { androidContext }) { sensorEvent ->
    onUpdate(
      LightSensorEvent(
        illuminance = sensorEvent.values[0].toDouble(),
        timestamp = sensorEvent.timestamp / 1_000_000_000.0
      )
    )
  }

  @Event(name = "lightSensorDidUpdate")
  private val onUpdate = event<LightSensorEvent>(
    onStartObserving = { startObserving(sensorProxy) },
    onStopObserving = { stopObserving(sensorProxy) }
  )

  override fun onDestroy() {
    stopObserving(sensorProxy)
  }

  @JS
  suspend fun setUpdateInterval(updateInterval: Int) {
    sensorProxy.setUpdateInterval(updateInterval)
  }

  @JS
  suspend fun isAvailableAsync(): Boolean = sensorProxy.isAvailable
}
