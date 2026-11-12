package expo.modules.location.next.geofencing

import android.annotation.SuppressLint
import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Log
import com.google.android.gms.common.api.ApiException
import com.google.android.gms.common.api.Status
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofenceStatusCodes
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingEvent
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.next.LocationModuleNext
import java.util.concurrent.atomic.AtomicInteger

private const val TAG = "ExpoLocation"

class GmsGeofencingTaskConsumer(
  context: Context,
  taskManagerUtils: TaskManagerUtilsInterface?
) : TaskConsumer(context, taskManagerUtils) {
  @Volatile
  var task: TaskInterface? = null

  @Volatile
  private var pendingIntent: PendingIntent? = null

  @Volatile
  private var currentRegionIds: Set<String> = emptySet()

  private val geofencingClient: GeofencingClient by lazy {
    LocationServices.getGeofencingClient(context)
  }

  override fun taskType(): String = "geofencingNext"

  override fun didRegister(registeredTask: TaskInterface?) {
    task = registeredTask ?: return
    pendingIntent = taskManagerUtils.createTaskIntent(context, registeredTask)
    updateRegions(registeredTask.options)
  }

  override fun setOptions(options: MutableMap<String, Any>?) {
    updateRegions(options)
  }

  @SuppressLint("MissingPermission")
  private fun updateRegions(options: Map<String, Any?>?) {
    val currentPendingIntent = pendingIntent ?: return
    val regions = options.toGeofencingRegions()
    val newRegionIds = regions.map { it.identifier }.toSet()
    val removedRegionIds = currentRegionIds - newRegionIds
    currentRegionIds = newRegionIds

    if (regions.isNotEmpty()) {
      val request = GeofencingRequest.Builder()
        .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER or GeofencingRequest.INITIAL_TRIGGER_EXIT)
        .addGeofences(regions.map { it.toGeofence() })
        .build()
      try {
        geofencingClient.addGeofences(request, currentPendingIntent).addOnFailureListener(::stopRequestAndReportError)
      } catch (e: Exception) {
        stopRequestAndReportError(e)
      }
    }

    if (removedRegionIds.isNotEmpty()) {
      geofencingClient.removeGeofences(removedRegionIds.toList()).addOnFailureListener(::stopRequestAndReportError)
    }
  }

  override fun didUnregister() {
    task = null
    currentRegionIds = emptySet()
    pendingIntent?.let { currentPendingIntent ->
      runCatching { geofencingClient.removeGeofences(currentPendingIntent) }
      currentPendingIntent.cancel()
    }
    pendingIntent = null
  }

  override fun didReceiveBroadcast(intent: Intent?) {
    val currentTask = task ?: return
    val event = intent?.let { GeofencingEvent.fromIntent(it) } ?: return

    if (event.hasError()) {
      stopRequestAndReportError(ApiException(Status(event.errorCode)))
      return
    }

    val state = when (event.geofenceTransition) {
      Geofence.GEOFENCE_TRANSITION_ENTER -> "inside"
      Geofence.GEOFENCE_TRANSITION_EXIT -> "outside"
      else -> return
    }
    val timestamp = (event.triggeringLocation?.time ?: System.currentTimeMillis()).toDouble()
    val bundles = event.triggeringGeofences.orEmpty().map { geofence ->
      PersistableBundle().apply {
        putString("identifier", geofence.requestId)
        putString("state", state)
        putDouble("timestamp", timestamp)
      }
    }
    if (bundles.isEmpty()) {
      return
    }
    if (LocationModuleNext.modulesStarted.get() > 0) {
      execute(currentTask, bundles) {}
      return
    }
    runCatching {
      taskManagerUtils.scheduleJob(context, currentTask, bundles)
    }.onFailure { Log.w(TAG, "Could not schedule a job for the geofencing events", it) }
  }

  override fun didExecuteJob(jobService: JobService?, params: JobParameters?): Boolean {
    val currentTask = task ?: return false
    val bundles = taskManagerUtils.extractDataFromJobParams(params)
    if (bundles.isEmpty()) {
      return false
    }
    execute(currentTask, bundles) { jobService?.jobFinished(params, false) }
    return true
  }

  private fun execute(currentTask: TaskInterface, bundles: List<PersistableBundle>, onDone: () -> Unit) {
    val remaining = AtomicInteger(bundles.size)
    bundles.forEach { bundle ->
      val error = bundle.getString("error")?.let(::Error)
      val data = if (error == null) {
        Bundle(bundle)
      } else {
        null
      }
      currentTask.execute(data, error) {
        if (remaining.decrementAndGet() == 0) {
          onDone()
        }
      }
    }
  }

  private fun stopRequestAndReportError(cause: Exception) {
    val currentTask = task ?: return
    val statusCode = (cause as? ApiException)?.statusCode
    val message = when (statusCode) {
      null ->
        "Android could not monitor the regions passed to start: ${cause.message ?: cause}"
      GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE ->
        "Android stopped monitoring the regions because geofencing is not available. Check that location " +
          "services are on and the background location permission is granted, then start the geofencing task again"
      GeofenceStatusCodes.GEOFENCE_TOO_MANY_GEOFENCES ->
        "Android monitors at most 100 regions per app, so it rejected the regions passed to start. " +
          "Reduce the number of regions passed to start, including regions monitored elsewhere in the app, " +
          "and start the geofencing task again"
      GeofenceStatusCodes.GEOFENCE_TOO_MANY_PENDING_INTENTS ->
        "Android allows at most 5 pending intents for geofencing per app, so it rejected the regions passed " +
          "to start. Remove other geofencing registrations in the app and start the geofencing task again"
      else ->
        "Android could not monitor the regions passed to start: ${GeofenceStatusCodes.getStatusCodeString(statusCode)}"
    }
    pendingIntent?.let { runCatching { geofencingClient.removeGeofences(it) } }
    currentRegionIds = emptySet()
    val bundles = listOf(PersistableBundle().apply { putString("error", message) })
    if (LocationModuleNext.modulesStarted.get() > 0) {
      execute(currentTask, bundles) {}
      return
    }
    runCatching {
      taskManagerUtils.scheduleJob(context, currentTask, bundles)
    }.onFailure { Log.w(TAG, "Could not schedule a job for the geofencing error", it) }
  }
}
