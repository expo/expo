// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.hardware.Sensor
import expo.modules.sensors.PedometerResult
import expo.modules.sensors.PermissionResponse
import expo.modules.sensors.PlayServicesNotLinkedException
import expo.modules.sensors.SensorProxy
import expo.modules.sensors.askForActivityRecognitionPermissions
import expo.modules.sensors.createSensorProxy
import expo.modules.sensors.getActivityRecognitionPermissions
import expo.modules.sensors.startObserving
import expo.modules.sensors.stopObserving
import expo.modules.sensors.toPedometerResult
import io.github.expo.modules.v2.Event
import io.github.expo.modules.v2.ExpoModule
import io.github.expo.modules.v2.JS
import io.github.expo.modules.v2.Module
import io.github.expo.modules.v2.async.Promise
import io.github.expo.modules.v2.react.androidContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

@ExpoModule("ExponentPedometer")
class PedometerModule : Module() {
  private var stepsAtTheBeginning: Int? = null

  private val sensorProxy: SensorProxy = createSensorProxy(
    Sensor.TYPE_STEP_COUNTER
  ) { sensorEvent ->
    val initialSteps = stepsAtTheBeginning
      ?: (sensorEvent.values[0].toInt() - 1).also { stepsAtTheBeginning = it }
    onUpdate(sensorEvent.toPedometerResult(initialSteps))
  }

  private val playServices: PedometerPlayServices? by lazy {
    val isPlayServicesLinked = try {
      Class.forName("com.google.android.gms.fitness.FitnessLocal")
      true
    } catch (_: ClassNotFoundException) {
      false
    }
    if (isPlayServicesLinked) {
      PedometerPlayServices(androidContext.applicationContext)
    } else {
      null
    }
  }

  @Event(name = "Exponent.pedometerUpdate")
  private val onUpdate = event<PedometerResult>(
    onStartObserving = {
      stepsAtTheBeginning = null
      startObserving(sensorProxy)
    },
    onStopObserving = { stopObserving(sensorProxy) }
  )

  override fun onDestroy() {
    stopObserving(sensorProxy)
  }

  @JS
  fun setUpdateInterval(updateInterval: Int): Promise<Unit> {
    sensorProxy.setUpdateInterval(updateInterval)
    return Promise.resolve()
  }

  @JS
  fun isAvailableAsync(): Promise<Boolean> = Promise.resolve(sensorProxy.isAvailable)

  @JS
  private fun getPermissionsAsync(): Promise<PermissionResponse> =
    getActivityRecognitionPermissions()

  @JS
  private fun requestPermissionsAsync(): Promise<PermissionResponse> =
    askForActivityRecognitionPermissions()

  @JS
  suspend fun isRecordingAvailableAsync(): Boolean = withContext(Dispatchers.IO) {
    playServices?.isRecordingAvailable() ?: false
  }

  @JS
  suspend fun subscribeRecordingAsync() {
    withContext(Dispatchers.IO) {
      val playServices = playServices ?: throw PlayServicesNotLinkedException()
      playServices.subscribeRecording()
    }
  }

  @JS
  suspend fun unsubscribeRecordingAsync() {
    withContext(Dispatchers.IO) {
      playServices?.unsubscribeRecording()
    }
  }

  @JS
  private suspend fun getStepCountAsync(startTime: Long, endTime: Long): PedometerResult =
    withContext(Dispatchers.IO) {
      val playServices = playServices ?: throw PlayServicesNotLinkedException()
      PedometerResult(steps = playServices.getStepCount(startTime, endTime).toInt())
    }
}
