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
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null
  private var mGeofencingClient: GeofencingClient? = null
  private var mGeofencingRequest: GeofencingRequest? = null
  private var mGeofencingList = mutableListOf<Geofence>()
  private val mRegions = mutableMapOf<String, PersistableBundle>()

  //region TaskConsumerInterface
  override fun taskType() = "geofencing"


  override fun didRegister(task: TaskInterface?) {
    if (task != null) {
      mTask = task
      startGeofencing()
    }
  }

  override fun didUnregister() {
    stopGeofencing()
    mTask = null
    mPendingIntent = null
    mGeofencingClient = null
    mGeofencingRequest = null
    mGeofencingList.clear()
  }

  override fun setOptions(options: Map<String, Any>) {
    super.setOptions(options)
    stopGeofencing()
    startGeofencing()
  }

  override fun didReceiveBroadcast(intent: Intent) {
    val event = GeofencingEvent.fromIntent(intent)
    val task = mTask ?: return
    if (event.hasError()) {
      val errorMessage = GeofencingHelpers.getErrorString(event.errorCode)
      val error = Error(errorMessage)
      task.execute(null, error)
      return
    }

    // Get region state and event type from given transition type.
    val geofenceTransition = event.geofenceTransition
    val regionState = GeofencingHelpers.regionStateForTransitionType(geofenceTransition)
    val eventType = GeofencingHelpers.eventTypeFromTransitionType(geofenceTransition)

    // Get the geofences that were triggered. A single event can trigger multiple geofences.
    event.triggeringGeofences.forEach { geofence ->
      val region = mRegions[geofence.requestId]
      if (region != null) {
        // Update region state in region bundle.
        region.putInt("state", regionState)
        val data = PersistableBundle().apply {
          putInt("eventType", eventType)
          putPersistableBundle("region", region)
        }
        val context = context.applicationContext
        taskManagerUtils.scheduleJob(context, task, listOf(data))
      }
    }
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val task = mTask ?: return false
    taskManagerUtils.extractDataFromJobParams(params).forEach { item ->
      val region = Bundle().apply {
        putAll(item.getPersistableBundle("region"))
      }
      val bundle = Bundle().apply {
        putInt("eventType", item.getInt("eventType"))
        putBundle("region", region)
      }
      task.execute(bundle, null)
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
    val task = mTask
    if (task == null) {
      Log.w(TAG, "Task is null")
      return
    }

    // Create geofences from task options.
    val options = task.options
    val regions = options["regions"] as ArrayList<HashMap<String, Any>>?
    regions?.forEach { region ->
      val geofence = GeofencingHelpers.geofenceFromRegion(region)
      val regionIdentifier = geofence.requestId

      // Make a bundle for the region to remember its attributes. Only request ID is public in Geofence object.
      mRegions[regionIdentifier] = GeofencingHelpers.bundleFromRegion(regionIdentifier, region)

      // Add geofence to the list of observed regions.
      mGeofencingList.add(geofence)
    }

    // Prepare pending intent, geofencing request and client.
    val innerPendingIntent = preparePendingIntent()
    mPendingIntent = innerPendingIntent
    val innerGeofencingRequest = prepareGeofencingRequest(mGeofencingList)
    mGeofencingRequest = innerGeofencingRequest
    val innerGeofencingClient = LocationServices.getGeofencingClient(context)
    try {
      innerGeofencingClient.addGeofences(innerGeofencingRequest, innerPendingIntent)
      mGeofencingClient = innerGeofencingClient
    } catch (e: SecurityException) {
      Log.w(TAG, "Geofencing request has been rejected.", e)
    }
  }

  private fun stopGeofencing() {
    val innerGeofencingClient = mGeofencingClient ?: return
    val innerPendingIntent = mPendingIntent ?: return
    innerGeofencingClient.removeGeofences(innerPendingIntent)
    innerPendingIntent.cancel()
  }

  private fun prepareGeofencingRequest(geofences: List<Geofence>) =
    GeofencingRequest.Builder()
      .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER or GeofencingRequest.INITIAL_TRIGGER_EXIT)
      .addGeofences(geofences)
      .build()

  private fun preparePendingIntent() =
    taskManagerUtils.createTaskIntent(context, mTask)

  companion object {
    private const val TAG = "GeofencingTaskConsumer"
  }
}
