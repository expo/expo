package expo.modules.location.taskConsumers

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Log
import com.google.android.gms.location.Geofence
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingEvent
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices
import expo.modules.location.LocationHelpers.isAnyProviderAvailable
import org.unimodules.interfaces.taskManager.TaskConsumer
import org.unimodules.interfaces.taskManager.TaskConsumerInterface
import org.unimodules.interfaces.taskManager.TaskInterface
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface
import java.util.*

class GeofencingTaskConsumer(
  context: Context,
  taskManagerUtils: TaskManagerUtilsInterface?
) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {
  private var task: TaskInterface? = null
  private var pendingIntent: PendingIntent? = null
  private var geofencingClient: GeofencingClient? = null
  private var geofencingRequest: GeofencingRequest? = null
  private var geofencingList = mutableListOf<Geofence>()
  private val regions = mutableMapOf<String, PersistableBundle>()

  //region TaskConsumerInterface
  override fun taskType() = "geofencing"

  override fun didRegister(internalTask: TaskInterface?) {
    internalTask?.let {
      task = internalTask
      startGeofencing()
    }
  }

  override fun didUnregister() {
    stopGeofencing()
    task = null
    pendingIntent = null
    geofencingClient = null
    geofencingRequest = null
    geofencingList.clear()
  }

  override fun setOptions(options: Map<String, Any>) {
    super.setOptions(options)
    stopGeofencing()
    startGeofencing()
  }

  override fun didReceiveBroadcast(intent: Intent) {
    val internalTask = task ?: return
    val event = GeofencingEvent.fromIntent(intent)
    if (event.hasError()) {
      val errorMessage = GeofencingHelpers.getErrorString(event.errorCode)
      val error = Error(errorMessage)
      internalTask.execute(null, error)
      return
    }

    // Get region state and event type from given transition type.
    val geofenceTransition = event.geofenceTransition
    val regionState = GeofencingHelpers.regionStateForTransitionType(geofenceTransition)
    val eventType = GeofencingHelpers.eventTypeFromTransitionType(geofenceTransition)

    // Get the geofences that were triggered. A single event can trigger multiple geofences.
    event.triggeringGeofences.forEach { geofence ->
      val region = regions[geofence.requestId]
      region?.let {
        // Update region state in region bundle.
        it.putInt("state", regionState)
        val data = PersistableBundle().apply {
          putInt("eventType", eventType)
          putPersistableBundle("region", it)
        }
        val context = context.applicationContext
        taskManagerUtils.scheduleJob(context, internalTask, listOf(data))
      }
    }
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val internalTask = task ?: return false
    taskManagerUtils.extractDataFromJobParams(params).forEach { item ->
      val region = Bundle().apply {
        putAll(item.getPersistableBundle("region"))
      }
      val bundle = Bundle().apply {
        putInt("eventType", item.getInt("eventType"))
        putBundle("region", region)
      }
      internalTask.execute(bundle, null)
    }
    return true
  }

  //endregion
  //region helpers
  private fun startGeofencing() {
    if (context == null) {
      Log.w(TAG, "The context has been abandoned.")
      return
    }
    if (!isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available.")
      return
    }
    val internalTask = task
    if (internalTask == null) {
      Log.w(TAG, "Task is null")
      return
    }

    // Create geofences from task options.
    val options = internalTask.options
    val internalRegions = options["regions"] as ArrayList<HashMap<String, Any>>?
    internalRegions?.forEach { region ->
      val geofence = GeofencingHelpers.geofenceFromRegion(region)
      val regionIdentifier = geofence.requestId

      // Make a bundle for the region to remember its attributes. Only request ID is public in Geofence object.
      regions[regionIdentifier] = GeofencingHelpers.bundleFromRegion(regionIdentifier, region)

      // Add geofence to the list of observed regions.
      geofencingList.add(geofence)
    }

    // Prepare pending intent, geofencing request and client.
    val innerPendingIntent = preparePendingIntent()
    pendingIntent = innerPendingIntent
    val innerGeofencingRequest = prepareGeofencingRequest(geofencingList)
    geofencingRequest = innerGeofencingRequest
    val innerGeofencingClient = LocationServices.getGeofencingClient(context)
    try {
      innerGeofencingClient.addGeofences(innerGeofencingRequest, innerPendingIntent)
      geofencingClient = innerGeofencingClient
    } catch (e: SecurityException) {
      Log.w(TAG, "Geofencing request has been rejected.", e)
    }
  }

  private fun stopGeofencing() {
    val innerGeofencingClient = geofencingClient ?: return
    val innerPendingIntent = pendingIntent ?: return
    innerGeofencingClient.removeGeofences(innerPendingIntent)
    innerPendingIntent.cancel()
  }

  private fun prepareGeofencingRequest(geofences: List<Geofence>) =
    GeofencingRequest.Builder()
      .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER or GeofencingRequest.INITIAL_TRIGGER_EXIT)
      .addGeofences(geofences)
      .build()

  private fun preparePendingIntent() =
    taskManagerUtils.createTaskIntent(context, task)

  companion object {
    private const val TAG = "GeofencingTaskConsumer"
  }
}
