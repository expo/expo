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
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null
  private var mService: LocationTaskService? = null
  private var mLocationClient: FusedLocationProviderClient? = null
  private var mLastReportedLocation: Location? = null
  private var mDeferredDistance = 0.0
  private val mDeferredLocations: MutableList<Location> = ArrayList()
  private var mIsHostPaused = true

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "location"
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task
    startLocationUpdates()
    maybeStartForegroundService()
  }

  override fun didUnregister() {
    stopLocationUpdates()
    stopForegroundService()
    mTask = null
    mPendingIntent = null
    mLocationClient = null
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
    if (mTask == null) {
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
    val locationRequest = prepareLocationRequest(mTask!!.options)
    val pendingIntent = preparePendingIntent()
    mPendingIntent = pendingIntent
    try {
      val innerLocationClient = LocationServices.getFusedLocationProviderClient(context)
      innerLocationClient.requestLocationUpdates(locationRequest, pendingIntent)
      mLocationClient = innerLocationClient
    } catch (e: SecurityException) {
      Log.w(TAG, "Location request has been rejected.", e)
    }
  }

  private fun stopLocationUpdates() {
    val locationClient = mLocationClient
    val pendingIntent = mPendingIntent
    if (null != locationClient && pendingIntent != null) {
      locationClient.removeLocationUpdates(pendingIntent)
      pendingIntent.cancel()
    }
  }

  private fun maybeStartForegroundService() {
    // Foreground service is available as of Android Oreo.
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    val task = mTask ?: return
    val options: ReadableArguments = MapArguments(task.options)
    val useForegroundService = shouldUseForegroundService(task.options)
    if (context == null) {
      Log.w(TAG, "Context not found when trying to start foreground service.")
      return
    }

    // Service is already running, but the task has been registered again without `foregroundService` option.
    if (mService != null && !useForegroundService) {
      stopForegroundService()
      return
    }

    // Service is not running and the user don't want to start foreground service.
    if (!useForegroundService) {
      return
    }

    // Foreground service is requested but not running.
    if (mService == null) {
      val serviceIntent = Intent(context, LocationTaskService::class.java)
      val serviceOptions = options.getArguments(FOREGROUND_SERVICE_KEY).toBundle()

      // extras param name is appId for legacy reasons
      val extras = Bundle().apply {
        putString("appId", task.appScopeKey)
        putString("taskName", task.name)
      }
      serviceIntent.putExtras(extras)
      context.startForegroundService(serviceIntent)
      context.bindService(
        serviceIntent,
        object : ServiceConnection {
          override fun onServiceConnected(name: ComponentName, service: IBinder) {
            val innerService = (service as ServiceBinder).service
            innerService.setParentContext(context)
            innerService.startForeground(serviceOptions)
            mService = innerService
          }

          override fun onServiceDisconnected(name: ComponentName) {
            mService?.stop()
            mService = null
          }
        },
        Context.BIND_AUTO_CREATE
      )
    } else {
      // Restart the service with new service options.
      mService!!.startForeground(options.getArguments(FOREGROUND_SERVICE_KEY).toBundle())
    }
  }

  private fun stopForegroundService() {
    val service = mService ?: return
    service.stop()
  }

  private fun deferLocations(locations: List<Location>) {
    val size = mDeferredLocations.size
    var lastLocation = if (size > 0) mDeferredLocations[size - 1] else mLastReportedLocation
    locations.forEach { location ->
      if (lastLocation != null) {
        mDeferredDistance += abs(location.distanceTo(lastLocation)).toDouble()
      }
      lastLocation = location
    }
    mDeferredLocations.addAll(locations)
  }

  private fun maybeReportDeferredLocations() {
    if (!shouldReportDeferredLocations()) {
      // Don't report locations yet - continue deferring them.
      return
    }
    val context = context.applicationContext
    val data: MutableList<PersistableBundle?> = ArrayList()
    mDeferredLocations.forEach { location ->
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
      mLastReportedLocation = mDeferredLocations[mDeferredLocations.size - 1]
      mDeferredDistance = 0.0
      mDeferredLocations.clear()

      // Schedule new job.
      taskManagerUtils.scheduleJob(context, mTask, data)
    }
  }

  private fun shouldReportDeferredLocations(): Boolean {
    val task = mTask
    if (mDeferredLocations.size == 0 || task == null) {
      return false
    }
    if (!mIsHostPaused) {
      // Don't defer location updates when the activity is in foreground state.
      return true
    }
    val oldestLocation = mLastReportedLocation ?: mDeferredLocations[0]
    val newestLocation = mDeferredLocations[mDeferredLocations.size - 1]
    val options: Arguments = MapHelper(task.options)
    val distance = options.getDouble("deferredUpdatesDistance")
    val interval = options.getLong("deferredUpdatesInterval")
    return newestLocation.time - oldestLocation.time >= interval && mDeferredDistance >= distance
  }

  private fun preparePendingIntent() =
    taskManagerUtils.createTaskIntent(context, mTask)

  private fun executeTaskWithLocationBundles(
    locationBundles: ArrayList<Bundle>,
    callback: TaskExecutionCallback
  ) {
    val task = mTask
    if (locationBundles.size > 0 && task != null) {
      val data = Bundle()
      data.putParcelableArrayList("locations", locationBundles)
      task.execute(data, null, callback)
    } else {
      callback.onFinished(null)
    }
  }

  override fun onHostResume() {
    mIsHostPaused = false
    maybeReportDeferredLocations()
  }

  override fun onHostPause() {
    mIsHostPaused = true
  }

  override fun onHostDestroy() {
    mIsHostPaused = true
  } //endregion

  companion object {
    private const val TAG = "LocationTaskConsumer"
    private const val FOREGROUND_SERVICE_KEY = "foregroundService"
    private var sLastTimestamp: Long = 0
    fun shouldUseForegroundService(options: Map<String?, Any?>): Boolean {
      return options.containsKey(FOREGROUND_SERVICE_KEY)
    }
  }
}
