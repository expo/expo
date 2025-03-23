// Copyright 2015-present 650 Industries. All rights reserved.
package expo.modules.sensors.modules

import android.Manifest
import android.hardware.Sensor
import android.os.Build
import android.os.Bundle
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.tasks.Tasks
import com.google.android.gms.fitness.FitnessLocal
import com.google.android.gms.fitness.LocalRecordingClient
import com.google.android.gms.fitness.data.LocalDataType
import com.google.android.gms.fitness.data.LocalField
import com.google.android.gms.fitness.request.LocalDataReadRequest
import expo.modules.interfaces.permissions.Permissions
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.sensors.UseSensorProxy
import expo.modules.sensors.createSensorProxy

private const val EventName = "Exponent.pedometerUpdate"

class NotSupportedException(message: String) : CodedException(message)
class MissingPermissionException(permission: String) : CodedException("Missing $permission permission")

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
      GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(
        appContext.reactContext ?: throw Exceptions.ReactContextLost(),
        LocalRecordingClient.LOCAL_RECORDING_CLIENT_MIN_VERSION_CODE
      ) == ConnectionResult.SUCCESS
    }

    AsyncFunction("subscribeRecording") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      // The recording client is only available on Oreo (API 26) and above.
      // `isRecordingAvailable` can be used to check for support, otherwise we throw here.
      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      try {
        Tasks.await(localRecordingClient.subscribe(LocalDataType.TYPE_STEP_COUNT_DELTA))
      } catch (e: SecurityException) {
        throw MissingPermissionException("ACTIVITY_RECOGNITION")
      }
      true
    }

    AsyncFunction("unsubscribeRecording") {
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
      val localRecordingClient = FitnessLocal.getLocalRecordingClient(context)
      Tasks.await(localRecordingClient.unsubscribe(LocalDataType.TYPE_STEP_COUNT_DELTA))
    }

    AsyncFunction("getStepCountAsync") { startTime: Long, endTime: Long ->
      val context = appContext.reactContext ?: throw Exceptions.ReactContextLost()
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
  }
}
