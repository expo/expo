// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorManager
import android.os.Bundle
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import abi48_0_0.expo.modules.interfaces.sensors.services.BarometerServiceInterface
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.core.interfaces.ExpoMethod

class BarometerModule(reactContext: Context?) : BaseSensorModule(reactContext) {
  override val eventName: String = "barometerDidUpdate"

  override fun getName(): String = "ExpoBarometer"

  override fun getSensorService(): SensorServiceInterface {
    return moduleRegistry.getModule(BarometerServiceInterface::class.java)
  }

  override fun eventToMap(sensorEvent: SensorEvent): Bundle {
    return Bundle().apply {
      // TODO: Bacon: Can we get relative altitude?
      putDouble("pressure", sensorEvent.values[0].toDouble())
    }
  }

  @ExpoMethod
  fun startObserving(promise: Promise) {
    super.startObserving()
    promise.resolve(null)
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    super.stopObserving()
    promise.resolve(null)
  }

  @ExpoMethod
  fun setUpdateInterval(updateInterval: Int, promise: Promise) {
    super.setUpdateInterval(updateInterval)
    promise.resolve(null)
  }

  @ExpoMethod
  fun isAvailableAsync(promise: Promise) {
    val mSensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
    val isAvailable = mSensorManager.getDefaultSensor(Sensor.TYPE_PRESSURE) != null
    promise.resolve(isAvailable)
  }
}
