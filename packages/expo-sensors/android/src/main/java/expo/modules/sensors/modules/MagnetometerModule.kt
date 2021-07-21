// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorManager
import android.os.Bundle
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.sensors.services.MagnetometerServiceInterface
import org.unimodules.core.Promise
import org.unimodules.core.interfaces.ExpoMethod

class MagnetometerModule(reactContext: Context?) : BaseSensorModule(reactContext) {
  override fun getName(): String {
    return "ExponentMagnetometer"
  }

  override val eventName: String
    get() = "magnetometerDidUpdate"
  override val sensorService: SensorServiceInterface
    protected get() = moduleRegistry!!.getModule(MagnetometerServiceInterface::class.java)

  override fun eventToMap(sensorEvent: SensorEvent?): Bundle? {
    val map = Bundle()
    map.putDouble("x", sensorEvent!!.values[0].toDouble())
    map.putDouble("y", sensorEvent.values[1].toDouble())
    map.putDouble("z", sensorEvent.values[2].toDouble())
    return map
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
    val isAvailable = mSensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD) != null
    promise.resolve(isAvailable)
  }
}