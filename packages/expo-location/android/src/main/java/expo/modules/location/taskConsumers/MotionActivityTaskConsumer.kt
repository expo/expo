package expo.modules.location.taskConsumers

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.os.PersistableBundle
import android.util.Log
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityRecognitionResult
import expo.modules.core.arguments.MapArguments
import expo.modules.core.arguments.ReadableArguments
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.AppForegroundedSingleton
import expo.modules.location.LocationHelpers
import expo.modules.location.services.MotionActivityTaskService
import expo.modules.location.services.MotionActivityTaskService.ServiceBinder

class MotionActivityTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface?) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null
  private var mService: MotionActivityTaskService? = null

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "motionActivity"
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task
    startMotionActivityUpdates()
    maybeStartForegroundService()
  }

  override fun didUnregister() {
    stopMotionActivityUpdates()
    stopForegroundService()
    mTask = null
    mPendingIntent = null
  }

  override fun setOptions(options: Map<String, Any>) {
    super.setOptions(options)

    // Restart the foreground service if its option has changed.
    maybeStartForegroundService()
  }

  override fun didReceiveBroadcast(intent: Intent) {
    val task = mTask ?: return
    val result = ActivityRecognitionResult.extractResult(intent) ?: return
    val activity = LocationHelpers.motionActivityRecordFromResult(result)
    val context = context.applicationContext

    taskManagerUtils.scheduleJob(context, task, listOf(activity.toPersistableBundle()))
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters): Boolean {
    val task = mTask ?: return false
    val data = taskManagerUtils.extractDataFromJobParams(params)

    for (persistableActivityBundle in data) {
      val bundle = Bundle().apply {
        putBundle("activity", persistableActivityBundle.toDeepBundle())
      }
      task.execute(bundle, null) { jobService.jobFinished(params, false) }
    }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true
  }

  //endregion
  //region private

  // `Bundle.putAll(PersistableBundle)` only copies the top level - nested PersistableBundle
  // values (e.g. `activities`, and each activity type within it) stay PersistableBundle
  // instances, which the bridge can't serialize. Rebuild the tree with real Bundles instead.
  private fun PersistableBundle.toDeepBundle(): Bundle {
    val bundle = Bundle().apply { putAll(this@toDeepBundle) }
    for (key in keySet()) {
      getPersistableBundle(key)?.let { bundle.putBundle(key, it.toDeepBundle()) }
    }
    return bundle
  }

  private fun startMotionActivityUpdates() {
    val context = context ?: run {
      Log.w(TAG, "The context has been abandoned")
      return
    }
    val pendingIntent = preparePendingIntent()
    mPendingIntent = pendingIntent

    try {
      ActivityRecognition.getClient(context)
        .requestActivityUpdates(MOTION_ACTIVITY_INTERVAL_MS, pendingIntent)
    } catch (e: SecurityException) {
      Log.w(TAG, "Motion activity request has been rejected.", e)
    }
  }

  private fun stopMotionActivityUpdates() {
    mPendingIntent?.let {
      ActivityRecognition.getClient(context).removeActivityUpdates(it)
      it.cancel()
    }
  }

  private fun preparePendingIntent(): PendingIntent {
    return taskManagerUtils.createTaskIntent(context, mTask)
  }

  // A foreground service keeps this task's process (and JS engine) alive across an app kill,
  // the same way background location does. Without it, activity updates that arrive while the
  // app is killed are only delivered once the process happens to be woken up for another reason,
  // e.g. the user reopening the app.
  private fun maybeStartForegroundService() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return
    }
    if (!AppForegroundedSingleton.isForegrounded) {
      Log.w(TAG, "Foreground motion activity task cannot be started while the app is in the background!")
      return
    }
    val task = mTask ?: run {
      Log.w(TAG, "Motion activity task is null")
      return
    }
    val options: ReadableArguments = MapArguments(task.options)
    val useForegroundService = shouldUseForegroundService(task.options)

    // Service is already running, but the task has been registered again without `foregroundService` option.
    if (mService != null && !useForegroundService) {
      stopForegroundService()
      return
    }

    // Service is not running and the user doesn't want to start foreground service.
    if (!useForegroundService) {
      return
    }

    // Foreground service is requested but not running.
    if (mService == null) {
      val serviceIntent = Intent(context, MotionActivityTaskService::class.java)
      val extras = Bundle()
      val serviceOptions = options.getArguments(FOREGROUND_SERVICE_KEY).toBundle()

      // extras param name is appId for legacy reasons
      extras.putString("appId", task.appScopeKey)
      extras.putString("taskName", task.name)
      extras.putBoolean("killService", serviceOptions.getBoolean("killServiceOnDestroy", false))
      serviceIntent.putExtras(extras)
      context.startForegroundService(serviceIntent)
      context.bindService(
        serviceIntent,
        object : ServiceConnection {
          override fun onServiceConnected(name: ComponentName, service: IBinder) {
            mService = (service as? ServiceBinder)?.service
            mService?.let {
              it.setParentContext(context)
              it.startForeground(serviceOptions)
            }
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
      mService?.startForeground(options.getArguments(FOREGROUND_SERVICE_KEY).toBundle())
    }
  }

  private fun stopForegroundService() {
    mService?.stop()
  }

  companion object {
    private const val TAG = "MotionActivityTaskConsumer"
    private const val MOTION_ACTIVITY_INTERVAL_MS = 0L
    private const val FOREGROUND_SERVICE_KEY = "foregroundService"

    fun shouldUseForegroundService(options: Map<String?, Any?>): Boolean {
      return options.containsKey(FOREGROUND_SERVICE_KEY)
    }
  }
}
