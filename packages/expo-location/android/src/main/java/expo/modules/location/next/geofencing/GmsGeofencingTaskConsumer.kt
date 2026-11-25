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
    val taskName = task?.name ?: return
    val regions = options.orEmpty().toGeofencingRegions()
    geofencingClient.removeGeofences(currentPendingIntent).addOnFailureListener(::stopRequestAndReportError)

    if (regions.isNotEmpty()) {
      val request = GeofencingRequest.Builder()
        .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER or GeofencingRequest.INITIAL_TRIGGER_EXIT)
        .addGeofences(regions.map { it.toGeofence(taskName) })
        .build()
      try {
        geofencingClient.addGeofences(request, currentPendingIntent).addOnFailureListener(::stopRequestAndReportError)
      } catch (e: Exception) {
        stopRequestAndReportError(e)
      }
    }
  }

  override fun didUnregister() {
    task = null
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

    val bundles = event.toBundles(currentTask.name)
    if (bundles.isEmpty()) {
      return
    }
    executeOrScheduleTask(currentTask, bundles)
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
    pendingIntent?.let { runCatching { geofencingClient.removeGeofences(it) } }
    val bundles = listOf(PersistableBundle().apply { putString("error", cause.toGeofencingErrorMessage()) })
    executeOrScheduleTask(currentTask, bundles)
  }

  private fun executeOrScheduleTask(currentTask: TaskInterface, bundles: List<PersistableBundle>) {
    if (LocationModuleNext.modulesStarted.get() > 0) {
      execute(currentTask, bundles) {}
      return
    }
    runCatching {
      taskManagerUtils.scheduleJob(context, currentTask, bundles)
    }.onFailure { Log.w(TAG, "Could not schedule a job for the geofencing event", it) }
  }
}

private fun GeofencingEvent.toBundles(taskName: String): List<PersistableBundle> {
  val state = when (geofenceTransition) {
    Geofence.GEOFENCE_TRANSITION_ENTER -> "inside"
    Geofence.GEOFENCE_TRANSITION_EXIT -> "outside"
    else -> return emptyList()
  }
  val timestamp = (triggeringLocation?.time ?: System.currentTimeMillis()).toDouble()
  return triggeringGeofences.orEmpty().map { geofence ->
    PersistableBundle().apply {
      putString("identifier", geofence.requestId.removePrefix("$taskName/"))
      putString("state", state)
      putDouble("timestamp", timestamp)
    }
  }
}
