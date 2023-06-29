// Copyright 2015-present 650 Industries. All rights reserved.
package abi49_0_0.expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorManager
import android.os.Bundle
import abi49_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import abi49_0_0.expo.modules.interfaces.sensors.services.LightSensorServiceInterface
import abi49_0_0.expo.modules.core.Promise
import abi49_0_0.expo.modules.core.interfaces.ExpoMethod

class LightSensorModule(reactContext: Context?) : BaseSensorModule(reactContext) {
  override val eventName: String = "lightSensorDidUpdate"

  override fun getName(): String = "ExpoLightSensor"

  override fun getSensorService(): SensorServiceInterface {
    return moduleRegistry.getModule(LightSensorServiceInterface::class.java)
  }

  override fun eventToMap(sensorEvent: SensorEvent): Bundle {
    return Bundle().apply {
      putDouble("illuminance", sensorEvent.values[0].toDouble())
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
    val isAvailable = mSensorManager.getDefaultSensor(Sensor.TYPE_LIGHT) != null
    promise.resolve(isAvailable)
  }
}
