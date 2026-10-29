// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import expo.modules.sensors.SensorProxy
import expo.modules.sensors.ThreeAxisSensorEvent
import expo.modules.sensors.createSensorProxy
import expo.modules.sensors.startObserving
import expo.modules.sensors.stopObserving
import expo.modules.sensors.toThreeAxisSensorEvent
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise

@ExpoModule("ExponentMagnetometerUncalibrated")
class MagnetometerUncalibratedModule : Module() {
  private val sensorProxy: SensorProxy = createSensorProxy(
    Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED
  ) { sensorEvent ->
    onUpdate(sensorEvent.toThreeAxisSensorEvent())
  }

  @Event(name = "magnetometerUncalibratedDidUpdate")
  private val onUpdate = event<ThreeAxisSensorEvent>(
    onStartObserving = { startObserving(sensorProxy) },
    onStopObserving = { stopObserving(sensorProxy) }
  )

  override fun onDestroy() {
    stopObserving(sensorProxy)
  }

  @JS
  fun setUpdateInterval(updateInterval: Int): Promise<Unit> {
    sensorProxy.setUpdateInterval(updateInterval)
    return Promise.resolve()
  }

  @JS
  fun isAvailableAsync(): Promise<Boolean> {
    return Promise.resolve(sensorProxy.isAvailable)
  }
}
