// Copyright 2015-present 650 Industries. All rights reserved.
package abi48_0_0.expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorManager
import android.os.Bundle
import abi48_0_0.expo.modules.interfaces.sensors.SensorServiceInterface
import abi48_0_0.expo.modules.interfaces.sensors.services.MagnetometerUncalibratedServiceInterface
import abi48_0_0.expo.modules.core.Promise
import abi48_0_0.expo.modules.core.interfaces.ExpoMethod

class MagnetometerUncalibratedModule(reactContext: Context?) : BaseSensorModule(reactContext) {
  override val eventName: String = "magnetometerUncalibratedDidUpdate"

  override fun getName(): String = "ExponentMagnetometerUncalibrated"

  override fun getSensorService(): SensorServiceInterface {
    return moduleRegistry.getModule(MagnetometerUncalibratedServiceInterface::class.java)
  }

  override fun eventToMap(sensorEvent: SensorEvent): Bundle {
    return Bundle().apply {
      putDouble("x", sensorEvent.values[0].toDouble())
      putDouble("y", sensorEvent.values[1].toDouble())
      putDouble("z", sensorEvent.values[2].toDouble())
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
    val isAvailable = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD_UNCALIBRATED) != null
    promise.resolve(isAvailable)
  }
}
