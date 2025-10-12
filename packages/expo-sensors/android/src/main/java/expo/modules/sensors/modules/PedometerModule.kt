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
import androidx.core.content.ContextCompat
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
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
import java.util.concurrent.TimeUnit

private const val EventName = "Exponent.pedometerUpdate"
private const val EventNameEvent = "Exponent.pedometerEvent"
private const val TransitionAction = "expo.modules.sensors.PEDOMETER_TRANSITION"

class NotSupportedException(message: String) : CodedException(message)
class PedometerModule : Module() {
  private var stepsAtTheBeginning: Int? = null

  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

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

  private val activityRecognitionClient by lazy {
    ActivityRecognition.getClient(context)
  }

  private var transitionPendingIntent: PendingIntent? = null
  private var transitionsReceiver: BroadcastReceiver? = null
  private var isEventUpdatesActive = false

  override fun definition() = ModuleDefinition {
    Name("ExponentPedometer")

    Events(EventNameEvent)

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
      GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
        context,
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
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

      try {
        Tasks.await(activityRecognitionClient.requestActivityTransitionUpdates(request, pendingIntent))
      } catch (e: SecurityException) {
        throw Exceptions.MissingPermissions(Manifest.permission.ACTIVITY_RECOGNITION)
      }

      isEventUpdatesActive = true
      true
    }

    AsyncFunction("stopEventUpdates") {
      stopActivityTransitionUpdates()
    }

    AsyncFunction("subscribeRecording") {
      // The recording client is only available on Oreo (API 26) and above.
      // `isRecordingAvailable` can be used to check for support, otherwise we throw here.
      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      try {
        Tasks.await(localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA))
      } catch (e: SecurityException) {
        throw Exceptions.MissingPermissions(Manifest.permission.ACTIVITY_RECOGNITION)
      }
      true
    }

    AsyncFunction("unsubscribeRecording") {
      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      Tasks.await(localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA))
    }

    AsyncFunction("getStepCountAsync") { startTime: Long, endTime: Long ->
      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      val readRequest = LocalDataReadRequest.Builder()
        .aggregate(LocalDataType.TYPE_STEP_COUNT_DELTA)
        .bucketByTime(1, java.util.concurrent.TimeUnit.DAYS)
        .setTimeRange(startTime, endTime, java.util.concurrent.TimeUnit.MILLISECONDS)
        .build()

      val response = Tasks.await(localRecordingClient.readData(readRequest))

      if (!response.status.isSuccess)
        throw CodedException(
          "READ_DATA_FAILED",
          "Failed to read data from the Recording API. " +
            "Code: ${response.status.statusCode}. " +
            "Message: ${response.status.statusMessage}",
          null
        )

      var sum = 0
      for (bucket in response.buckets) {
        for (dataPoint in bucket.dataSets[0].dataPoints) {
          sum += dataPoint.getValue(LocalField.FIELD_STEPS).asInt()
        }
      }

      mapOf("steps" to sum.toLong())
    }

    OnDestroy {
      stopActivityTransitionUpdates()
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

  private fun ensureTransitionsReceiver(): Boolean {
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
    ContextCompat.registerReceiver(
      context,
      receiver,
      IntentFilter(TransitionAction),
      ContextCompat.RECEIVER_NOT_EXPORTED
    )

    return true
  }

  private fun stopActivityTransitionUpdates() {
    if (!isEventUpdatesActive) {
      unregisterTransitionsReceiver()
      return
    }

    val pendingIntent = transitionPendingIntent
    if (pendingIntent != null) {
      try {
        Tasks.await(activityRecognitionClient.removeActivityTransitionUpdates(pendingIntent))
      } catch (_: SecurityException) {
        // ignore missing permission at cleanup time
      }
      pendingIntent.cancel()
    }

    isEventUpdatesActive = false
    transitionPendingIntent = null
    unregisterTransitionsReceiver()
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
}
