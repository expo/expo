// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.Manifest
import android.hardware.Sensor
import android.os.Build
import android.os.Bundle
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy

private const val EventName = "Exponent.pedometerUpdate"
private const val EventNameEvent = "Exponent.pedometerEvent"
internal const val TaskTimeoutSeconds = 30L

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
class PlayServicesNotLinkedException : CodedException(
  "ERR_PEDOMETER_PLAY_SERVICES_NOT_LINKED",
  "Pedometer step history is not available because the app does not include the Google Play services " +
    "libraries for the pedometer. Set `pedometerPlayServicesEnabled` to `true` in the `expo-sensors` config plugin, " +
    "or set `expo.sensors.pedometer-play-services-enabled=true` in `android/gradle.properties`. Then rebuild the app.",
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

  private val isPlayServicesLinked by lazy {
    try {
      Class.forName("com.google.android.gms.fitness.FitnessLocal")
      Class.forName("com.google.android.gms.location.ActivityRecognition")
      true
    } catch (_: ClassNotFoundException) {
      false
    }
  }

  private var playServicesInstance: PedometerPlayServices? = null

  private val playServices: PedometerPlayServices?
    get() {
      if (!isPlayServicesLinked) {
        return null
      }
      playServicesInstance?.let { return it }
      val context = appContext.reactContext?.applicationContext ?: throw Exceptions.ReactContextLost()
      return PedometerPlayServices(context) { sendEvent(EventNameEvent, it) }
        .also { playServicesInstance = it }
    }

  override fun definition() = ModuleDefinition {
    Name("ExponentPedometer")

    UseSensorProxy(
      this@PedometerModule,
      Sensor.TYPE_STEP_COUNTER,
      EventName,
      listenerDecorator = { stepsAtTheBeginning = null },
      onModuleDestroy = { playServicesInstance?.stopActivityTransitionUpdates() }
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
      playServices?.isRecordingAvailable() ?: false
    }

    AsyncFunction("isEventTrackingAvailableAsync") {
      playServices?.isEventTrackingAvailable() ?: false
    }

    AsyncFunction("startEventUpdatesAsync") Coroutine { ->
      playServices?.startEventUpdates() ?: false
    }

    AsyncFunction("stopEventUpdatesAsync") Coroutine { ->
      playServicesInstance?.stopEventUpdates()
      Unit
    }

    AsyncFunction("subscribeRecordingAsync") Coroutine { ->
      val playServices = playServices ?: throw PlayServicesNotLinkedException()
      playServices.subscribeRecording()
    }

    AsyncFunction("unsubscribeRecordingAsync") Coroutine { ->
      playServices?.unsubscribeRecording()
      Unit
    }

    AsyncFunction("getStepCountAsync") Coroutine { startTime: Long, endTime: Long ->
      val playServices = playServices ?: throw PlayServicesNotLinkedException()
      mapOf("steps" to playServices.getStepCount(startTime, endTime))
    }
  }
}
