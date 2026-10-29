// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.annotation.SuppressLint
import android.hardware.Sensor
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.fitness.FitnessLocal
import com.google.android.gms.fitness.LocalRecordingClient
import com.google.android.gms.fitness.data.LocalDataType
import com.google.android.gms.fitness.data.LocalField
import com.google.android.gms.fitness.request.LocalDataReadRequest
import expo.modules.sensors.NotSupportedException
import expo.modules.sensors.PedometerActivityEvent
import expo.modules.sensors.PedometerResult
import expo.modules.sensors.PermissionResponse
import expo.modules.sensors.ReadDataFailedException
import expo.modules.sensors.SensorProxy
import expo.modules.sensors.askForActivityRecognitionPermissions
import expo.modules.sensors.awaitTask
import expo.modules.sensors.createActivityTransitionTracker
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
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

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

  private val activityTracker = createActivityTransitionTracker { onActivityEvent(it) }
  private val activityTrackerMutex = Mutex()

  @Event(name = "Exponent.pedometerUpdate")
  private val onUpdate = event<PedometerResult>(
    onStartObserving = {
      stepsAtTheBeginning = null
      startObserving(sensorProxy)
    },
    onStopObserving = { stopObserving(sensorProxy) }
  )

  @Event(name = "Exponent.pedometerEvent")
  private val onActivityEvent = event<PedometerActivityEvent>()

  override fun onDestroy() {
    stopObserving(sensorProxy)
    activityTracker.stop()
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
    isRecordingAvailable()
  }

  @JS
  suspend fun isEventTrackingAvailableAsync(): Boolean = withContext(Dispatchers.IO) {
    activityTracker.isAvailable()
  }

  @JS
  suspend fun startEventUpdatesAsync(): Boolean = withContext(Dispatchers.IO) {
    activityTrackerMutex.withLock { activityTracker.start() }
  }

  @JS
  suspend fun stopEventUpdatesAsync(): Unit = withContext(Dispatchers.IO) {
    activityTrackerMutex.withLock { activityTracker.stop() }
  }

  @SuppressLint("MissingPermission")
  @JS
  suspend fun subscribeRecordingAsync() {
    withContext(Dispatchers.IO) {
      val client = recordingClient()
      awaitTask("subscribe to recording updates") {
        client.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA)
      }
    }
  }

  @JS
  suspend fun unsubscribeRecordingAsync() {
    withContext(Dispatchers.IO) {
      val client = recordingClient()
      awaitTask("unsubscribe from recording updates") {
        client.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA)
      }
    }
  }

  @JS
  private suspend fun getStepCountAsync(startTime: Long, endTime: Long): PedometerResult =
    withContext(Dispatchers.IO) {
      val client = recordingClient()

      // `LocalDataReadRequest.Builder.build()` throws when the end time is not after the start time.
      if (endTime <= startTime) {
        return@withContext PedometerResult(steps = 0)
      }

      val readRequest = LocalDataReadRequest.Builder()
        .aggregate(LocalDataType.TYPE_STEP_COUNT_DELTA)
        .bucketByTime(1, TimeUnit.DAYS)
        .setTimeRange(startTime, endTime, TimeUnit.MILLISECONDS)
        .build()

      val response = awaitTask("read recorded step data") { client.readData(readRequest) }
      if (!response.status.isSuccess) {
        throw ReadDataFailedException(response.status.statusCode, response.status.statusMessage)
      }

      val sum = response.buckets
        .flatMap { it.dataSets }
        .flatMap { it.dataPoints }
        .sumOf { it.getValue(LocalField.FIELD_STEPS).asInt() }

      PedometerResult(steps = sum)
    }

  private fun isRecordingAvailable(): Boolean {
    return GoogleApiAvailability
      .getInstance()
      .isGooglePlayServicesAvailable(
        androidContext,
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
  }

  private fun recordingClient(): LocalRecordingClient {
    if (!isRecordingAvailable()) {
      throw NotSupportedException("Pedometer Recording API is not available on this device.")
    }
    return FitnessLocal.getLocalRecordingClient(androidContext)
  }
}
