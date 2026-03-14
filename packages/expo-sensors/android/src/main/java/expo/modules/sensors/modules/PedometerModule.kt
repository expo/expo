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
import com.google.android.gms.tasks.Tasks
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
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy
import java.util.concurrent.CancellationException
import java.util.concurrent.ExecutionException
import java.util.concurrent.TimeUnit

private const val EventName = "Exponent.pedometerUpdate"
private const val EventNameEvent = "Exponent.pedometerEvent"
private const val TransitionAction = "expo.modules.sensors.PEDOMETER_TRANSITION"

class NotSupportedException(message: String) : CodedException(message)

class TaskCancelledException(operationName: String) : CodedException(
  "TASK_CANCELLED",
  "The pedometer operation was cancelled while attempting to $operationName.",
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

  override fun definition() = ModuleDefinition {
    val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
    val activityRecognitionClient = ActivityRecognition.getClient(context)

    fun isRecordingAvailable(): Boolean {
      return GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
        context,
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
    }

    fun <T> awaitTask(task: Task<T>, operationName: String): T {
      try {
        return Tasks.await(task)
      } catch (e: SecurityException) {
        throw Exceptions.MissingPermissions(Manifest.permission.ACTIVITY_RECOGNITION)
      } catch (e: CancellationException) {
        throw TaskCancelledException(operationName)
      } catch (e: InterruptedException) {
        Thread.currentThread().interrupt()
        throw TaskFailedException(operationName, e)
      } catch (e: ExecutionException) {
        val cause = e.cause
        if (cause is SecurityException) {
          throw Exceptions.MissingPermissions(Manifest.permission.ACTIVITY_RECOGNITION)
        }
        throw TaskFailedException(operationName, cause ?: e)
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
          activityRecognitionClient
            .removeActivityTransitionUpdates(pendingIntent)
            .addOnCompleteListener { pendingIntent.cancel() }
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
      GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
        context,
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
    }

    AsyncFunction("isEventTrackingAvailableAsync") {
      GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context) == ConnectionResult.SUCCESS
    }

    AsyncFunction("startEventUpdates") {
      if (isEventUpdatesActive) {
        return@AsyncFunction true
      }

      if (!ensureTransitionsReceiver()) {
        return@AsyncFunction false
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

      awaitTask(
        activityRecognitionClient.requestActivityTransitionUpdates(request, pendingIntent),
        "start event updates"
      )

      isEventUpdatesActive = true
      true
    }

    AsyncFunction("stopEventUpdates") {
      stopActivityTransitionUpdates()
    }

    AsyncFunction("subscribeRecordingAsync") {
      if (!isRecordingAvailable()) {
        throw NotSupportedException("Pedometer Recording API is not available on this device.")
      }

      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      awaitTask(
        localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA),
        "subscribe to recording updates"
      )
    }

    AsyncFunction("unsubscribeRecordingAsync") {
      if (!isRecordingAvailable()) {
        return@AsyncFunction null
      }

      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      awaitTask(
        localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA),
        "unsubscribe from recording updates"
      )
    }

    AsyncFunction("getStepCountAsync") { startTime: Long, endTime: Long ->
      if (!isRecordingAvailable()) {
        throw NotSupportedException("Pedometer Recording API is not available on this device.")
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
