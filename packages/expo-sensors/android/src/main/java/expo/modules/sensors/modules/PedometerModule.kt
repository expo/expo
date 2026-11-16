// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.Manifest
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.hardware.Sensor
import android.os.Build
import android.os.Bundle
import android.os.SystemClock
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.tasks.Task
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
import kotlin.coroutines.cancellation.CancellationException
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlinx.coroutines.TimeoutCancellationException
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import kotlinx.coroutines.withTimeout

private const val EventName = "Exponent.pedometerUpdate"
private const val EventNameEvent = "Exponent.pedometerEvent"
private const val TransitionAction = "expo.modules.sensors.PEDOMETER_TRANSITION"
private const val TaskTimeoutSeconds = 30L

class NotSupportedException(message: String) : CodedException(message)

class TaskCancelledException(operationName: String) : CodedException(
  "TASK_CANCELLED",
  "The pedometer operation was cancelled while attempting to $operationName.",
  null
)
class TaskTimeoutException(operationName: String) : CodedException(
  "TASK_TIMEOUT",
  "Google Play services did not respond within $TaskTimeoutSeconds seconds while attempting to $operationName. " +
    "Check that Google Play services is up to date on the device, then try again.",
  null
)
class TaskFailedException(operationName: String, cause: Throwable) : CodedException(
  "TASK_FAILED",
  "The pedometer operation failed while attempting to $operationName.",
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

  private var transitionPendingIntent: PendingIntent? = null
  private var transitionsReceiver: BroadcastReceiver? = null
  private var isEventUpdatesActive = false
  private val eventUpdatesMutex = Mutex()

  override fun definition() = ModuleDefinition {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    val activityRecognitionClient = ActivityRecognition.getClient(context)

    fun isRecordingAvailable(): Boolean {
      return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
        context,
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
    }

    suspend fun <T> awaitTask(task: Task<T>, operationName: String): T {
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

    fun ensureTransitionPendingIntent(): PendingIntent {
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

    fun unregisterTransitionsReceiver() {
      transitionsReceiver?.let {
        try {
          context.unregisterReceiver(it)
        } catch (_: IllegalArgumentException) {
          // Receiver already unregistered.
        }
      }
      transitionsReceiver = null
    }

    fun ensureTransitionsReceiver(): Boolean {
      if (GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) != ConnectionResult.SUCCESS) {
        return false
      }

      if (transitionsReceiver != null) {
        return true
      }

      val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
          if (intent == null) {
            return
          }
          if (!ActivityTransitionResult.hasResult(intent)) {
            return
          }

          val result = ActivityTransitionResult.extractResult(intent) ?: return

          for (event in result.transitionEvents) {
            when (event.activityType) {
              DetectedActivity.WALKING, DetectedActivity.RUNNING -> {
                val type = if (event.transitionType == ActivityTransition.ACTIVITY_TRANSITION_ENTER) {
                  "resume"
                } else {
                  "pause"
                }

                val elapsedNow = SystemClock.elapsedRealtimeNanos()
                val eventAgeNanos = elapsedNow - event.elapsedRealTimeNanos
                val eventTimestamp = System.currentTimeMillis() - TimeUnit.NANOSECONDS.toMillis(eventAgeNanos)

                val bundle = Bundle().apply {
                  putString("type", type)
                  putDouble("date", eventTimestamp.toDouble())
                }

                sendEvent(EventNameEvent, bundle)
              }

              else -> Unit
            }
          }
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

    Name("ExponentPedometer")

    UseSensorProxy(
      this@PedometerModule,
      Sensor.TYPE_STEP_COUNTER,
      EventName,
      listenerDecorator = { stepsAtTheBeginning = null },
      onModuleDestroy = { stopActivityTransitionUpdates() }
    ) { sensorProxy }
    Events(EventName, EventNameEvent)

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

    AsyncFunction("isEventTrackingAvailableAsync") {
      GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
    }

    AsyncFunction("startEventUpdatesAsync") Coroutine { ->
      eventUpdatesMutex.withLock {
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
    }

    AsyncFunction("stopEventUpdatesAsync") Coroutine { ->
      eventUpdatesMutex.withLock {
        stopActivityTransitionUpdates()
      }
    }

    AsyncFunction("subscribeRecordingAsync") Coroutine { ->
      if (!isRecordingAvailable()) {
        throw NotSupportedException("Pedometer Recording API is not available on this device.")
      }

      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      awaitTask(
        localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA),
        "subscribe to recording updates"
      )
      Unit
    }

    AsyncFunction("unsubscribeRecordingAsync") Coroutine { ->
      if (isRecordingAvailable()) {
        val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
        awaitTask(
          localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA),
          "unsubscribe from recording updates"
        )
      }
      Unit
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

      val response = awaitTask(
        localRecordingClient.readData(readRequest),
        "read recorded step data"
      )

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
