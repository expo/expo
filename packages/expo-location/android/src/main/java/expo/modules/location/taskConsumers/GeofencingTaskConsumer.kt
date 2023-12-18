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
import com.google.android.gms.location.GeofenceStatusCodes
import com.google.android.gms.location.GeofencingClient
import com.google.android.gms.location.GeofencingEvent
import com.google.android.gms.location.GeofencingRequest
import com.google.android.gms.location.LocationServices
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.GeofencingException
import expo.modules.location.LocationHelpers
import expo.modules.location.records.GeofencingRegionState
import expo.modules.location.LocationModule
import java.util.UUID

class GeofencingTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface?) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null
  private var mGeofencingClient: GeofencingClient? = null
  private var mGeofencingRequest: GeofencingRequest? = null
  private var mGeofencingList: MutableList<Geofence> = ArrayList()
  private var mRegions: MutableMap<String, PersistableBundle> = HashMap()

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "geofencing"
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task
    startGeofencing()
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
    val event = GeofencingEvent.fromIntent(intent) ?: run {
      Log.w(TAG, "Received a null geofencing event. Ignoring")
      return
    }

    if (event.hasError()) {
      val errorMessage = getErrorString(event.errorCode)
      val error = Error(errorMessage)
      mTask?.execute(null, error)
      return
    }

    // Get region state and event type from given transition type.
    val geofenceTransition = event.geofenceTransition
    val regionState = regionStateForTransitionType(geofenceTransition)
    val eventType = eventTypeFromTransitionType(geofenceTransition)
    val triggeringGeofences = event.triggeringGeofences ?: return

    for (geofence in triggeringGeofences) {
      mRegions[geofence.requestId]?.let {
        val data = PersistableBundle()

        // Update region state in region bundle.
        it.putInt("state", regionState.ordinal)
        data.putInt("eventType", eventType)
        data.putPersistableBundle("region", it)
        val context = context.applicationContext
        taskManagerUtils.scheduleJob(context, mTask, listOf(data))
      }
    }
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val task = mTask ?: return false

    val data = taskManagerUtils.extractDataFromJobParams(params)
    for (item in data) {
      val bundle = Bundle()
      val region = Bundle()
      region.putAll(item.getPersistableBundle("region"))
      bundle.putInt("eventType", item.getInt("eventType"))
      bundle.putBundle("region", region)

      task.execute(bundle, null) { jobService.jobFinished(params, false) }
    }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true
  }

  //endregion
  //region helpers
  private fun startGeofencing() {
    val context = context ?: run {
      Log.w(TAG, "The context has been abandoned")
      return
    }

    if (!LocationHelpers.isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available")
      return
    }
    mRegions = HashMap()
    mGeofencingList = ArrayList()

    // Create geofences from task options.
    val options = mTask?.options
      ?: throw GeofencingException("Task is null, can't start geofencing")
    val regions: List<HashMap<String, Any>> = (options["regions"] as ArrayList<*>).filterIsInstance<HashMap<String, Any>>()

    for (region in regions) {
      val geofence = geofenceFromRegion(region)
      val regionIdentifier = geofence.requestId

      // Make a bundle for the region to remember its attributes. Only request ID is public in Geofence object.
      mRegions[regionIdentifier] = bundleFromRegion(regionIdentifier, region)

      // Add geofence to the list of observed regions.
      mGeofencingList.add(geofence)
    }

    // Prepare pending intent, geofencing request and client.
    mPendingIntent = preparePendingIntent()
    mGeofencingRequest = prepareGeofencingRequest(mGeofencingList)
    mGeofencingClient = LocationServices.getGeofencingClient(getContext())

    try {
      mPendingIntent?.let { pendingIntent ->
        mGeofencingRequest?.let { geofencingRequest ->
          mGeofencingClient?.addGeofences(geofencingRequest, pendingIntent)
        }
      }
    } catch (e: SecurityException) {
      Log.w(TAG, "Geofencing request has been rejected.", e)
    }
  }

  private fun stopGeofencing() {
    mPendingIntent?.let {
      mGeofencingClient?.removeGeofences(it)
      it.cancel()
    }
  }

  private fun prepareGeofencingRequest(geofences: List<Geofence>): GeofencingRequest {
    return GeofencingRequest.Builder()
      .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER or GeofencingRequest.INITIAL_TRIGGER_EXIT)
      .addGeofences(geofences)
      .build()
  }

  private fun preparePendingIntent(): PendingIntent {
    return taskManagerUtils.createTaskIntent(context, mTask)
  }

  private fun getParamAsDouble(param: Any?, errorMessage: String): Double {
    return when (param) {
      is Double -> param
      is Float -> param.toDouble()
      is Int -> param.toDouble()
      is Long -> param.toDouble()
      is String -> param.toDoubleOrNull()
      else -> null
    } ?: throw GeofencingException(errorMessage)
  }

  private fun geofenceFromRegion(region: Map<String, Any>): Geofence {
    val identifier = region["identifier"] as? String ?: UUID.randomUUID().toString()
    val radius = getParamAsDouble(region["radius"], "Region: radius: `${region["radius"]}` can't be cast to Double")
    val longitude = getParamAsDouble(region["longitude"], "Region: longitude: `${region["longitude"]}` can't be cast to Double")
    val latitude = getParamAsDouble(region["latitude"], "Region: latitude `${region["latitude"]}` can't be cast to Double")
    val notifyOnEnter = region["notifyOnEnter"] as? Boolean ?: true
    val notifyOnExit = region["notifyOnExit"] as? Boolean ?: true
    val transitionTypes = (if (notifyOnEnter) Geofence.GEOFENCE_TRANSITION_ENTER else 0) or if (notifyOnExit) Geofence.GEOFENCE_TRANSITION_EXIT else 0
    return Geofence.Builder()
      .setRequestId(identifier)
      .setCircularRegion(latitude, longitude, radius.toFloat())
      .setExpirationDuration(Geofence.NEVER_EXPIRE)
      .setTransitionTypes(transitionTypes)
      .build()
  }

  private fun bundleFromRegion(identifier: String, region: Map<String, Any>): PersistableBundle {
    return PersistableBundle().apply {
      val radius = getParamAsDouble(region["radius"], "Region: radius: `${region["radius"]}` can't be cast to Double")
      val longitude = getParamAsDouble(region["longitude"], "Region: longitude: `${region["longitude"]}` can't be cast to Double")
      val latitude = getParamAsDouble(region["latitude"], "Region: latitude: `${region["latitude"]}` can't be cast to Double")
      putString("identifier", identifier)
      putDouble("radius", radius)
      putDouble("latitude", latitude)
      putDouble("longitude", longitude)
      putInt("state", GeofencingRegionState.UNKNOWN.ordinal)
    }
  }

  private fun regionStateForTransitionType(transitionType: Int): GeofencingRegionState {
    return when (transitionType) {
      Geofence.GEOFENCE_TRANSITION_ENTER, Geofence.GEOFENCE_TRANSITION_DWELL -> GeofencingRegionState.INSIDE
      Geofence.GEOFENCE_TRANSITION_EXIT -> GeofencingRegionState.OUTSIDE
      else -> GeofencingRegionState.UNKNOWN
    }
  }

  private fun eventTypeFromTransitionType(transitionType: Int): Int {
    return when (transitionType) {
      Geofence.GEOFENCE_TRANSITION_ENTER -> LocationModule.GEOFENCING_EVENT_ENTER
      Geofence.GEOFENCE_TRANSITION_EXIT -> LocationModule.GEOFENCING_EVENT_EXIT
      else -> 0
    }
  }

  companion object {
    private const val TAG = "GeofencingTaskConsumer"

    private fun getErrorString(errorCode: Int): String {
      return when (errorCode) {
        GeofenceStatusCodes.GEOFENCE_NOT_AVAILABLE -> "Geofencing not available."
        GeofenceStatusCodes.GEOFENCE_TOO_MANY_GEOFENCES -> "Too many geofences."
        GeofenceStatusCodes.GEOFENCE_TOO_MANY_PENDING_INTENTS -> "Too many pending intents."
        else -> "Unknown geofencing error."
      }
    } //endregion
  }
}
