// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.content.Context
import android.content.pm.PackageManager
import android.hardware.SensorEvent
import android.os.Bundle
import expo.modules.interfaces.sensors.SensorServiceInterface
import expo.modules.interfaces.sensors.services.PedometerServiceInterface
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod

class PedometerModule(reactContext: Context?) : BaseSensorModule(reactContext) {
  private var stepsAtTheBeginning: Int? = null
  override val eventName: String = "Exponent.pedometerUpdate"

  override fun getName(): String {
    return "ExponentPedometer"
  }

  override fun getSensorService(): SensorServiceInterface {
    return moduleRegistry.getModule(PedometerServiceInterface::class.java)
  }

  override fun eventToMap(sensorEvent: SensorEvent): Bundle {
    if (stepsAtTheBeginning == null) {
      stepsAtTheBeginning = sensorEvent.values[0].toInt() - 1
    }
    return Bundle().apply {
      putDouble("steps", (sensorEvent.values[0] - stepsAtTheBeginning!!).toDouble())
    }
  }

  @ExpoMethod
  fun startObserving(promise: Promise) {
    super.startObserving()
    stepsAtTheBeginning = null
    promise.resolve(null)
  }

  @ExpoMethod
  fun stopObserving(promise: Promise) {
    super.stopObserving()
    stepsAtTheBeginning = null
    promise.resolve(null)
  }

  @ExpoMethod
  fun setUpdateInterval(updateInterval: Int, promise: Promise) {
    super.setUpdateInterval(updateInterval)
    promise.resolve(null)
  }

  @ExpoMethod
  fun isAvailableAsync(promise: Promise) {
    promise.resolve(context.packageManager.hasSystemFeature(PackageManager.FEATURE_SENSOR_STEP_COUNTER))
  }

  @ExpoMethod
  fun getStepCountAsync(startDate: Int?, endDate: Int?, promise: Promise) {
    promise.reject("E_NOT_AVAILABLE", "Getting step count for date range is not supported on Android yet.")
  }
}
