package expo.modules.location.taskConsumers

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PersistableBundle
import android.util.Log
import com.google.android.gms.location.ActivityRecognition
import com.google.android.gms.location.ActivityRecognitionResult
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.location.LocationHelpers

class MotionActivityTaskConsumer(context: Context, taskManagerUtils: TaskManagerUtilsInterface?) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {
  private var mTask: TaskInterface? = null
  private var mPendingIntent: PendingIntent? = null

  //region TaskConsumerInterface
  override fun taskType(): String {
    return "motionActivity"
  }

  override fun didRegister(task: TaskInterface) {
    mTask = task
    startMotionActivityUpdates()
  }

  override fun didUnregister() {
    stopMotionActivityUpdates()
    mTask = null
    mPendingIntent = null
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

  companion object {
    private const val TAG = "MotionActivityTaskConsumer"
    private const val MOTION_ACTIVITY_INTERVAL_MS = 0L
  }
}
