// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import expo.modules.sensors.BarometerEvent
import expo.modules.sensors.SensorProxy
import expo.modules.sensors.createSensorProxy
import expo.modules.sensors.startObserving
import expo.modules.sensors.stopObserving
import expo.modules.sensors.toBarometerEvent
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise

@ExpoModule("ExpoBarometer")
class BarometerModule : Module() {
  @Volatile
  private var referencePressure: Float? = null

  private val sensorProxy: SensorProxy = createSensorProxy(
    Sensor.TYPE_PRESSURE
  ) { sensorEvent ->
    val reference = referencePressure ?: sensorEvent.values[0].also { referencePressure = it }
    onUpdate(sensorEvent.toBarometerEvent(reference))
  }

  @Event(name = "barometerDidUpdate")
  private val onUpdate = event<BarometerEvent>(
    onStartObserving = {
      referencePressure = null
      startObserving(sensorProxy)
    },
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
