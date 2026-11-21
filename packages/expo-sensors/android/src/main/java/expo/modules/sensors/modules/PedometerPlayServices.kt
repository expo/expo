// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.fitness.FitnessLocal
import com.google.android.gms.fitness.LocalRecordingClient
import com.google.android.gms.fitness.data.LocalDataType
import com.google.android.gms.fitness.data.LocalField
import com.google.android.gms.fitness.request.LocalDataReadRequest
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityTransition
import com.google.android.gms.location.ActivityTransitionRequest
import com.google.android.gms.location.ActivityTransitionResult
import com.google.android.gms.location.DetectedActivity
import com.google.android.gms.tasks.Task
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import java.util.concurrent.TimeUnit
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeout

private const val TransitionAction = "expo.modules.sensors.PEDOMETER_TRANSITION"

// The Play services libraries are `compileOnly` unless `expo.sensors.pedometer-play-services-enabled`
// is `true`. Only `PedometerModule` may create this class, after it checks that the libraries are linked.
// Public methods must not use Play services types in their signatures.
internal class PedometerPlayServices(
  private val context: Context,
  private val onPedometerEvent: (Bundle) -> Unit
) {
  private val activityRecognitionClient by lazy { ActivityRecognition.getClient(context) }
  private val localRecordingClient by lazy { FitnessLocal.getLocalRecordingClient(context) }

  private var transitionPendingIntent: PendingIntent? = null
  private var transitionsReceiver: BroadcastReceiver? = null
  private var isEventUpdatesActive = false
  private val eventUpdatesMutex = Mutex()

  fun isRecordingAvailable(): Boolean {
    return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
      context,
      LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
    ) == ConnectionResult.SUCCESS
  }

  fun isEventTrackingAvailable(): Boolean {
    return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
  }

  suspend fun startEventUpdates(): Boolean = eventUpdatesMutex.withLock {
    if (isEventUpdatesActive) {
      return@withLock true
    }

    if (!ensureTransitionsReceiver()) {
      return@withLock false
    }

    val pendingIntent = ensureTransitionPendingIntent()

    val transitions = listOf(
      ActivityTransition.Builder()
        .setActivityType(DetectedActivity.WALKING)
        .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
        .build(),
      ActivityTransition.Builder()
        .setActivityType(DetectedActivity.WALKING)
        .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
        .build(),
      ActivityTransition.Builder()
        .setActivityType(DetectedActivity.RUNNING)
        .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_ENTER)
        .build(),
      ActivityTransition.Builder()
        .setActivityType(DetectedActivity.RUNNING)
        .setActivityTransition(ActivityTransition.ACTIVITY_TRANSITION_EXIT)
        .build()
    )

    val request = ActivityTransitionRequest(transitions)

    try {
      awaitTask(
        activityRecognitionClient.requestActivityTransitionUpdates(request, pendingIntent),
        "start event updates"
      )
    } catch (e: CodedException) {
      stopActivityTransitionUpdates()
      throw e
    }

    isEventUpdatesActive = true
    true
  }

  suspend fun stopEventUpdates() {
    eventUpdatesMutex.withLock {
      stopActivityTransitionUpdates()
    }
  }

  fun stopActivityTransitionUpdates() {
    val pendingIntent = transitionPendingIntent
    if (pendingIntent != null) {
      if (isEventUpdatesActive) {
        activityRecognitionClient.removeActivityTransitionUpdates(pendingIntent)
      } else {
        pendingIntent.cancel()
      }
    }

    isEventUpdatesActive = false
    transitionPendingIntent = null
    unregisterTransitionsReceiver()
  }

  suspend fun subscribeRecording() {
    if (!isRecordingAvailable()) {
      throw NotSupportedException("Pedometer Recording API is not available on this device.")
    }

    awaitTask(
      localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA),
      "subscribe to recording updates"
    )
  }

  suspend fun unsubscribeRecording() {
    if (!isRecordingAvailable()) {
      return
    }

    awaitTask(
      localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA),
      "unsubscribe from recording updates"
    )
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

    val response = awaitTask(
      localRecordingClient.readData(readRequest),
      "read recorded step data"
    )

    if (!response.status.isSuccess) {
      throw ReadDataFailedException(response.status.statusCode, response.status.statusMessage)
    }

    return response.buckets
      .flatMap { it.dataSets }
      .flatMap { it.dataPoints }
      .sumOf { it.getValue(LocalField.FIELD_STEPS).asInt() }
      .toLong()
  }

  private suspend fun <T> awaitTask(task: Task<T>, operationName: String): T {
    try {
      return withTimeout(TimeUnit.SECONDS.toMillis(TaskTimeoutSeconds)) {
        suspendCancellableCoroutine { continuation ->
          task.addOnSuccessListener { continuation.resume(it) }
          task.addOnFailureListener { continuation.resumeWithException(it) }
          task.addOnCanceledListener { continuation.cancel() }
        }
      }
    } catch (e: TimeoutCancellationException) {
      throw TaskTimeoutException(operationName)
    } catch (e: CancellationException) {
      if (task.isCanceled) {
        throw TaskCancelledException(operationName)
      }
      throw e
    } catch (e: SecurityException) {
      throw Exceptions.MissingPermissions(Manifest.permission.ACTIVITY_RECOGNITION)
    } catch (e: Exception) {
      throw TaskFailedException(operationName, e)
    }
  }

  private fun ensureTransitionPendingIntent(): PendingIntent {
    transitionPendingIntent?.let { return it }

    val intent = Intent(TransitionAction).setPackage(context.packageName)
    val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_MUTABLE
    } else {
      PendingIntent.FLAG_UPDATE_CURRENT
    }

    val pendingIntent = PendingIntent.getBroadcast(context, 0, intent, flags)
    transitionPendingIntent = pendingIntent
    return pendingIntent
  }

  private fun unregisterTransitionsReceiver() {
    transitionsReceiver?.let {
      try {
        context.unregisterReceiver(it)
      } catch (_: IllegalArgumentException) {
        // Receiver already unregistered.
      }
    }
    transitionsReceiver = null
  }

  private fun ensureTransitionsReceiver(): Boolean {
    if (!isEventTrackingAvailable()) {
      return false
    }

    if (transitionsReceiver != null) {
      return true
    }

    val receiver = object : BroadcastReceiver() {
      // A change from walking to running is an exit and an enter, but the user did not stop.
      // Send an event only when the user changes between moving and not moving.
      private val activeActivityTypes = mutableSetOf<Int>()
      private var isMoving: Boolean? = null

      override fun onReceive(context: Context?, intent: Intent?) {
        if (intent == null) {
          return
        }
        if (!ActivityTransitionResult.hasResult(intent)) {
          return
        }

        val result = ActivityTransitionResult.extractResult(intent) ?: return
        val events = result.transitionEvents
          .filter { it.activityType == DetectedActivity.WALKING || it.activityType == DetectedActivity.RUNNING }
          .sortedBy { it.elapsedRealTimeNanos }
        if (events.isEmpty()) {
          return
        }

        for (event in events) {
          if (event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
            activeActivityTypes.add(event.activityType)
          } else {
            activeActivityTypes.remove(event.activityType)
          }
        }

        val isMovingNow = activeActivityTypes.isNotEmpty()
        if (isMovingNow == isMoving) {
          return
        }
        isMoving = isMovingNow

        val (type, transitionType) = if (isMovingNow) {
          "resume" to ActivityTransition.ACTIVITY_TRANSITION_ENTER
        } else {
          "pause" to ActivityTransition.ACTIVITY_TRANSITION_EXIT
        }
        val event = events.lastOrNull { it.transitionType == transitionType } ?: events.last()

        val elapsedNow = SystemClock.elapsedRealtimeNanos()
        val eventAgeNanos = elapsedNow - event.elapsedRealTimeNanos
        val eventTimestamp = System.currentTimeMillis() - TimeUnit.NANOSECONDS.toMillis(eventAgeNanos)

        onPedometerEvent(
          Bundle().apply {
            putString("type", type)
            putDouble("date", eventTimestamp.toDouble())
          }
        )
      }
    }

    transitionsReceiver = receiver
    val intentFilter = IntentFilter(TransitionAction)
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      context.registerReceiver(receiver, intentFilter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("DEPRECATION")
      context.registerReceiver(receiver, intentFilter)
    }

    return true
  }
}
