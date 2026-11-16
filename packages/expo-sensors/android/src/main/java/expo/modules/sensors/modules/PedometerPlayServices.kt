// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.Manifest
import android.content.Context
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.fitness.FitnessLocal
import com.google.android.gms.fitness.LocalRecordingClient
import com.google.android.gms.fitness.data.LocalDataType
import com.google.android.gms.fitness.data.LocalField
import com.google.android.gms.fitness.request.LocalDataReadRequest
import com.google.android.gms.tasks.Task
import expo.modules.kotlin.exception.Exceptions
import java.util.concurrent.TimeUnit
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.withTimeout

// The Play services libraries are `compileOnly` unless `expo.sensors.pedometer-play-services-enabled`
// is `true`. Only `PedometerModule` may create this class, after it checks that the libraries are linked.
// Public methods must not use Play services types in their signatures.
internal class PedometerPlayServices(private val context: Context) {
  private val localRecordingClient by lazy { FitnessLocal.getLocalRecordingClient(context) }

  fun isRecordingAvailable(): Boolean {
    return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
      context,
      LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
    ) == ConnectionResult.SUCCESS
  }

  suspend fun subscribeRecording() {
    if (!isRecordingAvailable()) {
      throw NotSupportedException("Pedometer Recording API is not available on this device.")
    }

    localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA).await()
  }

  suspend fun unsubscribeRecording() {
    if (!isRecordingAvailable()) {
      return
    }

    localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA).await()
  }

  suspend fun getStepCount(startTime: Long, endTime: Long): Long {
    if (!isRecordingAvailable()) {
      throw NotSupportedException("Pedometer Recording API is not available on this device.")
    }

    // `LocalDataReadRequest.Builder.build()` throws when the end time is not after the start time.
    if (endTime <= startTime) {
      return 0L
    }

    val readRequest = LocalDataReadRequest.Builder()
      .aggregate(LocalDataType.TYPE_STEP_COUNT_DELTA)
      .bucketByTime(1, TimeUnit.DAYS)
      .setTimeRange(startTime, endTime, TimeUnit.MILLISECONDS)
      .build()

    val response = localRecordingClient.readData(readRequest).await()

    if (!response.status.isSuccess) {
      throw ReadDataFailedException(response.status.statusCode, response.status.statusMessage)
    }

    return response.buckets
      .flatMap { it.dataSets }
      .flatMap { it.dataPoints }
      .sumOf { it.getValue(LocalField.FIELD_STEPS).asInt() }
      .toLong()
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
