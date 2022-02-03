// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorManager
import android.os.Bundle
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.sensors.services.AccelerometerServiceInterface
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod

class AccelerometerModule(reactContext: Context?) : BaseSensorModule(reactContext) {
  override val eventName: String = "accelerometerDidUpdate"

  override fun getName(): String = "ExponentAccelerometer"

  override fun getSensorService(): SensorServiceInterface {
    return moduleRegistry.getModule(AccelerometerServiceInterface::class.java)
  }

  override fun eventToMap(sensorEvent: SensorEvent): Bundle {
    return Bundle().apply {
      putDouble("x", (sensorEvent.values[0] / SensorManager.GRAVITY_EARTH).toDouble())
      putDouble("y", (sensorEvent.values[1] / SensorManager.GRAVITY_EARTH).toDouble())
      putDouble("z", (sensorEvent.values[2] / SensorManager.GRAVITY_EARTH).toDouble())
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
    val isAvailable = mSensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) != null
    promise.resolve(isAvailable)
  }
}
