// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.sensors

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import host.exp.exponent.kernel.services.BaseKernelService

abstract class BaseSensorKernelService internal constructor(reactContext: Context) : BaseKernelService(reactContext), SensorEventListener {
  private var sensor: Sensor? = null
  private val sensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

  abstract val sensorType: Int
  abstract fun onSensorDataChanged(sensorEvent: SensorEvent)

  protected fun startObserving() {
    sensor = sensorManager.getDefaultSensor(sensorType)
    if (sensor != null) {
      sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_FASTEST)
    }
  }

  protected fun stopObserving() {
    sensorManager.unregisterListener(this)
  }

  // android.hardware.SensorEventListener
  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
}
