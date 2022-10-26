// Copyright 2015-present 650 Industries. All rights reserved.
package abi47_0_0.expo.modules.sensors.services

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.hardware.Sensor
import android.hardware.SensorEventListener2
import android.hardware.SensorManager
import android.os.Build

abstract class BaseSensorService internal constructor(reactContext: Context?) : BaseService(reactContext!!), SensorEventListener2 {
  private var mSensor: Sensor? = null
  private val mSensorManager: SensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
  private val samplingPeriodUs: Int
    get() = if (hasHighSamplingRateSensorsPermission()) SensorManager.SENSOR_DELAY_FASTEST else SensorManager.SENSOR_DELAY_NORMAL

  // Abstract methods that subclasses should implement
  abstract val sensorType: Int

  // Public API
  protected fun startObserving() {
    if (mSensorManager.getDefaultSensor(sensorType).also { mSensor = it } != null) {
      mSensorManager.registerListener(this, mSensor, samplingPeriodUs)
    }
  }

  protected fun stopObserving() {
    mSensorManager.unregisterListener(this)
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
}
