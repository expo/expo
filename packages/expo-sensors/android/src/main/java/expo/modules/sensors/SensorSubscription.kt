// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Build

class SensorSubscription(
  private val context: Context,
  private val sensorType: Int,
  private val listener: SensorEventListener2,
  var updateInterval: Long = 100L
) : SensorEventListener2 by listener {
  private var mSensor: Sensor? = null
  private val mSensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val samplingPeriodUs: Int
    get() = if (hasHighSamplingRateSensorsPermission()) {
      SensorManager.SENSOR_DELAY_FASTEST
    } else {
      SensorManager.SENSOR_DELAY_NORMAL
    }

  private var lastUpdate = 0L

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    val currentTime = System.currentTimeMillis()
    if (currentTime - lastUpdate > updateInterval) {
      listener.onSensorChanged(sensorEvent)
      lastUpdate = currentTime
    }
  }

  // Public API
  fun startObserving() {
    if (mSensorManager.getDefaultSensor(sensorType).also { mSensor = it } != null) {
      mSensorManager.registerListener(this, mSensor, samplingPeriodUs)
    }
  }

  fun stopObserving() {
    mSensorManager.unregisterListener(this)
  }

  private fun hasHighSamplingRateSensorsPermission(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
      return true
    }

    return try {
      context.packageManager.getPackageInfo(context.packageName, PackageManager.GET_PERMISSIONS)?.run {
        requestedPermissions?.contains(Manifest.permission.HIGH_SAMPLING_RATE_SENSORS)
      } ?: false
    } catch (e: PackageManager.NameNotFoundException) {
      false
    }
  }
}
