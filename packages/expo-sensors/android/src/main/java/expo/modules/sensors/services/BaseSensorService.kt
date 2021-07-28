// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.services

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEventListener2
import android.hardware.SensorManager

abstract class BaseSensorService internal constructor(reactContext: Context?) : BaseService(reactContext!!), SensorEventListener2 {
  private var mSensor: Sensor? = null
  private val mSensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

  // Abstract methods that subclasses should implement
  abstract val sensorType: Int

  // Public API
  protected fun startObserving() {
    if (mSensorManager.getDefaultSensor(sensorType).also { mSensor = it } != null) {
      mSensorManager.registerListener(this, mSensor, SensorManager.SENSOR_DELAY_FASTEST)
    }
  }

  protected fun stopObserving() {
    mSensorManager.unregisterListener(this)
  }
}
