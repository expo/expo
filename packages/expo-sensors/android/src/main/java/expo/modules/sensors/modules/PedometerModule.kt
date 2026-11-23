// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.Manifest
import android.hardware.Sensor
import android.os.Build
import android.os.Bundle
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.fitness.FitnessLocal
import com.google.android.gms.fitness.LocalRecordingClient
import com.google.android.gms.fitness.data.LocalDataType
import com.google.android.gms.fitness.data.LocalField
import com.google.android.gms.fitness.request.LocalDataReadRequest
import com.google.android.gms.tasks.Task
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout

private const val EventName = "Exponent.pedometerUpdate"
private const val TaskTimeoutSeconds = 30L

class NotSupportedException(message: String) : CodedException(message)

class TaskCancelledException : CodedException(
  "TASK_CANCELLED",
  "Google Play services cancelled the pedometer Recording API request. Try again.",
  null
)
class TaskTimeoutException : CodedException(
  "TASK_TIMEOUT",
  "Google Play services did not respond to the pedometer Recording API request within $TaskTimeoutSeconds seconds. " +
    "Check that Google Play services is up to date on the device, then try again.",
  null
)
class TaskFailedException(cause: Throwable?) : CodedException(
  "TASK_FAILED",
  "The pedometer Recording API request to Google Play services failed.",
  cause
)
class ReadDataFailedException(statusCode: Int, statusMessage: String?) : CodedException(
  "READ_DATA_FAILED",
  "Failed to read data from the Recording API. Code: $statusCode. Message: $statusMessage",
  null
)
class PedometerModule : Module() {
  private var stepsAtTheBeginning: Int? = null

  private val sensorProxy by lazy {
    createSensorProxy(EventName, Sensor.TYPE_STEP_COUNTER, appContext) { sensorEvent ->
      if (stepsAtTheBeginning == null) {
        stepsAtTheBeginning = sensorEvent.values[0].toInt() - 1
      }
      Bundle().apply {
        putDouble("steps", (sensorEvent.values[0] - (stepsAtTheBeginning ?: (sensorEvent.values[0].toInt() - 1))).toDouble())
      }
    }
  }

  override fun definition() = ModuleDefinition {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()

    fun isRecordingAvailable(): Boolean {
      return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
        context,
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
    }

    Name("ExponentPedometer")

    UseSensorProxy(
      this@PedometerModule,
      Sensor.TYPE_STEP_COUNTER,
      EventName,
      listenerDecorator = { stepsAtTheBeginning = null }
    ) { sensorProxy }

    AsyncFunction("getPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.ACTIVITY_RECOGNITION)
      } else {
        // Permissions don't need to be requested on Android versions below Q
        Permissions.getPermissionsWithPermissionsManager(appContext.permissions, promise)
      }
    }

    AsyncFunction("requestPermissionsAsync") { promise: Promise ->
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise, Manifest.permission.ACTIVITY_RECOGNITION)
      } else {
        // Permissions don't need to be requested on Android versions below Q
        Permissions.askForPermissionsWithPermissionsManager(appContext.permissions, promise)
      }
    }

    AsyncFunction("isRecordingAvailableAsync") {
      isRecordingAvailable()
    }

    AsyncFunction("subscribeRecordingAsync") Coroutine { ->
      if (!isRecordingAvailable()) {
        throw NotSupportedException("Pedometer Recording API is not available on this device.")
      }

      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA).await()
    }

    AsyncFunction("unsubscribeRecordingAsync") Coroutine { ->
      if (isRecordingAvailable()) {
        val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
        localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA).await()
      }
    }

    AsyncFunction("getStepCountAsync") Coroutine { startTime: Long, endTime: Long ->
      if (!isRecordingAvailable()) {
        throw NotSupportedException("Pedometer Recording API is not available on this device.")
      }

      // `LocalDataReadRequest.Builder.build()` throws when the end time is not after the start time.
      if (endTime <= startTime) {
        return@Coroutine mapOf("steps" to 0L)
      }

      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      val readRequest = LocalDataReadRequest.Builder()
        .aggregate(LocalDataType.TYPE_STEP_COUNT_DELTA)
        .bucketByTime(1, TimeUnit.DAYS)
        .setTimeRange(startTime, endTime, TimeUnit.MILLISECONDS)
        .build()

      val response = localRecordingClient.readData(readRequest).await()

      if (!response.status.isSuccess) {
        throw ReadDataFailedException(response.status.statusCode, response.status.statusMessage)
      }

      val sum = response.buckets
        .flatMap { it.dataSets }
        .flatMap { it.dataPoints }
        .sumOf { it.getValue(LocalField.FIELD_STEPS).asInt() }

      mapOf("steps" to sum.toLong())
    }
  }
}

private suspend fun <T> Task<T>.await(): T {
  try {
    return withTimeout(TimeUnit.SECONDS.toMillis(TaskTimeoutSeconds)) {
      suspendCancellableCoroutine { continuation ->
        addOnCompleteListener { task ->
          when {
            task.isSuccessful -> continuation.resume(task.result)
            task.isCanceled -> continuation.resumeWithException(TaskCancelledException())
            task.exception is SecurityException -> continuation.resumeWithException(
              Exceptions.MissingPermissions(Manifest.permission.ACTIVITY_RECOGNITION)
            )
            else -> continuation.resumeWithException(TaskFailedException(task.exception))
          }
        }
      }
    }
  } catch (e: TimeoutCancellationException) {
    throw TaskTimeoutException()
  }
}
