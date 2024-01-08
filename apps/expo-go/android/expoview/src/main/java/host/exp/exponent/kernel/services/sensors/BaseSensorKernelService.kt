// Copyright 2015-present 650 Industries. All rights reserved.
package host.exp.exponent.kernel.services.sensors

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Build
import host.exp.exponent.kernel.services.BaseKernelService

abstract class BaseSensorKernelService internal constructor(reactContext: Context) : BaseKernelService(reactContext), SensorEventListener {
  private var sensor: Sensor? = null
  private val sensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val samplingPeriodUs: Int
    get() = if (hasHighSamplingRateSensorsPermission()) SensorManager.SENSOR_DELAY_FASTEST else SensorManager.SENSOR_DELAY_NORMAL

  abstract val sensorType: Int
  abstract fun onSensorDataChanged(sensorEvent: SensorEvent)

  protected fun startObserving() {
    sensor = sensorManager.getDefaultSensor(sensorType)
    if (sensor != null) {
      sensorManager.registerListener(this, sensor, samplingPeriodUs)
    }
  }

  protected fun stopObserving() {
    sensorManager.unregisterListener(this)
  }

  private fun hasHighSamplingRateSensorsPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return true
    }

    return try {
      context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)?.run {
        requestedPermissions.contains(Manifest.permission.HIGH_SAMPLING_RATE_SENSORS)
      } ?: false
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }
  }

  // android.hardware.SensorEventListener
  override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
}
