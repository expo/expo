package expo.modules.location.taskConsumers

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.location.Location
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PersistableBundle
import android.util.Log
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import expo.modules.core.MapHelper
import expo.modules.core.arguments.MapArguments
import expo.modules.core.arguments.ReadableArguments
import expo.modules.core.interfaces.Arguments
import expo.modules.core.interfaces.LifecycleEventListener
import expo.modules.location.LocationHelpers.isAnyProviderAvailable
import expo.modules.location.LocationHelpers.locationToBundle
import expo.modules.location.LocationHelpers.prepareLocationRequest
import expo.modules.location.services.LocationTaskService
import expo.modules.location.services.LocationTaskService.ServiceBinder
import org.unimodules.interfaces.taskManager.TaskConsumer
import org.unimodules.interfaces.taskManager.TaskConsumerInterface
import org.unimodules.interfaces.taskManager.TaskExecutionCallback
import org.unimodules.interfaces.taskManager.TaskInterface
import org.unimodules.interfaces.taskManager.TaskManagerUtilsInterface
import kotlin.math.abs

class LocationTaskConsumer(context: Context?, taskManagerUtils: TaskManagerUtilsInterface?) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface, LifecycleEventListener {
  private var task: TaskInterface? = null
  private var pendingIntent: PendingIntent? = null
  private var service: LocationTaskService? = null
  private var locationClient: FusedLocationProviderClient? = null
  private var lastReportedLocation: Location? = null
  private var deferredDistance = 0.0
  private val deferredLocations: MutableList<Location> = ArrayList()
  private var isHostPaused = true

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "location"
  }

  override fun didRegister(internalTask: TaskInterface) {
    task = internalTask
    startLocationUpdates()
    maybeStartForegroundService()
  }

  override fun didUnregister() {
    stopLocationUpdates()
    stopForegroundService()
    task = null
    pendingIntent = null
    locationClient = null
  }

  override fun setOptions(options: Map<String, Any>) {
    super.setOptions(options)

    // Restart location updates
    stopLocationUpdates()
    startLocationUpdates()

    // Restart foreground service if its option has changed.
    maybeStartForegroundService()
  }

  override fun didReceiveBroadcast(intent: Intent) {
    if (task == null) {
      return
    }
    val result = LocationResult.extractResult(intent) ?: return
    val locations = result.locations
    deferLocations(locations)
    maybeReportDeferredLocations()
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val data = taskManagerUtils.extractDataFromJobParams(params)
    val locationBundles = ArrayList<Bundle>()
    data.forEach {
      if (it != null) {
        val coordsBundle = Bundle().apply {
          putAll(it.getPersistableBundle("coords"))
        }
        locationBundles.add(
          Bundle().apply {
            putAll(it)
            putBundle("coords", coordsBundle)
          }
        )
      }
    }
    executeTaskWithLocationBundles(locationBundles) { jobService.jobFinished(params, false) }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true
  }

  //region private
  private fun startLocationUpdates() {
    val context = context
    if (context == null) {
      Log.w(TAG, "The context has been abandoned.")
      return
    }
    if (!isAnyProviderAvailable(context)) {
      Log.w(TAG, "There is no location provider available.")
      return
    }
    val locationRequest = prepareLocationRequest(task!!.options)
    val intent = preparePendingIntent()
    pendingIntent = intent
    try {
      val innerLocationClient = LocationServices.getFusedLocationProviderClient(context)
      innerLocationClient.requestLocationUpdates(locationRequest, intent)
      locationClient = innerLocationClient
    } catch (e: SecurityException) {
      Log.w(TAG, "Location request has been rejected.", e)
    }
  }

  private fun stopLocationUpdates() {
    val locationProviderClient = locationClient
    val intent = pendingIntent
    if (null != locationProviderClient && intent != null) {
      locationProviderClient.removeLocationUpdates(intent)
      intent.cancel()
    }
  }

  private fun maybeStartForegroundService() {
    // Foreground service is available as of Android Oreo.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val internalTask = task ?: return
    val options: ReadableArguments = MapArguments(internalTask.options)
    val useForegroundService = shouldUseForegroundService(internalTask.options)
    if (context == null) {
      Log.w(TAG, "Context not found when trying to start foreground service.")
      return
    }

    // Service is already running, but the internalTask has been registered again without `foregroundService` option.
    if (service != null && !useForegroundService) {
      stopForegroundService()
      return
    }

    // Service is not running and the user don't want to start foreground service.
    if (!useForegroundService) {
      return
    }

    // Foreground service is requested but not running.
    if (service == null) {
      val serviceIntent = Intent(context, LocationTaskService::class.java)
      val serviceOptions = options.getArguments(FOREGROUND_SERVICE_KEY).toBundle()

      // extras param name is appId for legacy reasons
      val extras = Bundle().apply {
        putString("appId", internalTask.appScopeKey)
        putString("taskName", internalTask.name)
      }
      serviceIntent.putExtras(extras)
      context.startForegroundService(serviceIntent)
      context.bindService(
        serviceIntent,
        object : ServiceConnection {
          override fun onServiceConnected(name: ComponentName, serviceBinder: IBinder) {
            val innerService = (serviceBinder as ServiceBinder).service
            innerService.setParentContext(context)
            innerService.startForeground(serviceOptions)
            service = innerService
          }

          override fun onServiceDisconnected(name: ComponentName) {
            service?.stop()
            service = null
          }
        },
        Context.BIND_AUTO_CREATE
      )
    } else {
      // Restart the service with new service options.
      service!!.startForeground(options.getArguments(FOREGROUND_SERVICE_KEY).toBundle())
    }
  }

  private fun stopForegroundService() {
    val locationTaskService = service ?: return
    locationTaskService.stop()
  }

  private fun deferLocations(locations: List<Location>) {
    val size = deferredLocations.size
    var lastLocation = if (size > 0) deferredLocations[size - 1] else lastReportedLocation
    locations.forEach { location ->
      if (lastLocation != null) {
        deferredDistance += abs(location.distanceTo(lastLocation)).toDouble()
      }
      lastLocation = location
    }
    deferredLocations.addAll(locations)
  }

  private fun maybeReportDeferredLocations() {
    if (!shouldReportDeferredLocations()) {
      // Don't report locations yet - continue deferring them.
      return
    }
    val context = context.applicationContext
    val data: MutableList<PersistableBundle?> = ArrayList()
    deferredLocations.forEach { location ->
      val timestamp = location.time

      // Some devices may broadcast the same location multiple times (mostly twice) so we're filtering out these locations,
      // so only one location at the specific timestamp can schedule a job.
      if (timestamp > sLastTimestamp) {
        val bundle = locationToBundle(location, PersistableBundle::class.java)
        data.add(bundle)
        sLastTimestamp = timestamp
      }
    }
    if (data.size > 0) {
      // Save last reported location, reset the distance and clear a list of locations.
      lastReportedLocation = deferredLocations[deferredLocations.size - 1]
      deferredDistance = 0.0
      deferredLocations.clear()

      // Schedule new job.
      taskManagerUtils.scheduleJob(context, task, data)
    }
  }

  private fun shouldReportDeferredLocations(): Boolean {
    val internalTask = task ?: return false
    if (deferredLocations.size == 0) {
      return false
    }
    if (!isHostPaused) {
      // Don't defer location updates when the activity is in foreground state.
      return true
    }
    val oldestLocation = lastReportedLocation ?: deferredLocations[0]
    val newestLocation = deferredLocations[deferredLocations.size - 1]
    val options: Arguments = MapHelper(internalTask.options)
    val distance = options.getDouble("deferredUpdatesDistance")
    val interval = options.getLong("deferredUpdatesInterval")
    return newestLocation.time - oldestLocation.time >= interval && deferredDistance >= distance
  }

  private fun preparePendingIntent() =
    taskManagerUtils.createTaskIntent(context, task)

  private fun executeTaskWithLocationBundles(
    locationBundles: ArrayList<Bundle>,
    callback: TaskExecutionCallback
  ) {
    val internalTask = task
    if (locationBundles.size > 0 && internalTask != null) {
      internalTask.execute(
        Bundle().apply {
          putParcelableArrayList("locations", locationBundles)
        },
        null, callback
      )
    } else {
      callback.onFinished(null)
    }
  }

  override fun onHostResume() {
    isHostPaused = false
    maybeReportDeferredLocations()
  }

  override fun onHostPause() {
    isHostPaused = true
  }

  override fun onHostDestroy() {
    isHostPaused = true
  } //endregion

  companion object {
    private const val TAG = "LocationTaskConsumer"
    private const val FOREGROUND_SERVICE_KEY = "foregroundService"
    private var sLastTimestamp: Long = 0
    fun shouldUseForegroundService(options: Map<String, Any?>): Boolean {
      return options.containsKey(FOREGROUND_SERVICE_KEY)
    }
  }
}
