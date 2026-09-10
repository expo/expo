package expo.modules.location.next

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.PersistableBundle
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
abstract class LocationTaskConsumer(
  context: Context,
  taskManagerUtils: TaskManagerUtilsInterface?,
): TaskConsumer(context, taskManagerUtils) {
  var mTask: TaskInterface? = null
  var mPendingIntent: PendingIntent? = null

  override fun taskType(): String = "location"

  final override fun didRegister(task: TaskInterface?) {
    mTask = task
    val task = mTask ?: run { return }
    val pendingIntent = taskManagerUtils.createTaskIntent(context, task)
    if (requestLocationUpdates(pendingIntent)) {
      mPendingIntent = pendingIntent
    }
  }

  abstract fun requestLocationUpdates(pendingIntent: PendingIntent): Boolean

  final override fun didUnregister() {
    mTask = null
    mPendingIntent?.let {
      stopLocationUpdates(it)
      it.cancel()
    }
    mPendingIntent = null
  }

  abstract fun stopLocationUpdates(pendingIntent: PendingIntent)

  final override fun setOptions(options: MutableMap<String, Any>?) {
    val task = mTask ?: return
    mPendingIntent?.let { stopLocationUpdates(it) }
    mPendingIntent = null

    val pendingIntent = taskManagerUtils.createTaskIntent(context, task)
    if (requestLocationUpdates(pendingIntent)) {
      mPendingIntent = pendingIntent
    }
  }

  final override fun didReceiveBroadcast(intent: Intent?) {
    val task = mTask ?: return
    val locationData = decodeBatchedPositions(intent)
    if (locationData.data == null && locationData.error == null) {
      return
    }

    if (LocationModuleNext.modulesStarted.get() > 0) {
      task.execute(locationData.toBundle(), null)
    } else {
      taskManagerUtils.scheduleJob(context, task, locationData.toPersistableBundleList())
    }
  }
  abstract fun decodeBatchedPositions(intent: Intent?): BatchedPositions

  final override fun didExecuteJob(jobService: JobService?, params: JobParameters?): Boolean {
    val task = mTask ?: return false
    val locationData = taskManagerUtils.extractDataFromJobParams(params).toBatchedPositions()
    task.execute(locationData.toBundle(), null) {
      jobService?.jobFinished(params, false)
    }
    return true
  }
}

class BatchedPositions(
  @Field val data: List<Position>? = null,
  @Field val error: String? = null,
) : Record {
  fun toBundle(): Bundle {
    val bundle = Bundle()
    data?.let { positions -> bundle.putParcelableArrayList("data", ArrayList(positions.map { it.toBundle() })) }
    error?.let { bundle.putString("error", it) }
    return bundle
  }

  fun toPersistableBundleList(): List<PersistableBundle> {
    val bundles = if (data != null) {
      data.map { it.toPersistableBundle() }
    } else {
      val bundle = PersistableBundle()
      bundle.putString("error", error)
      listOf(bundle)
    }
    return bundles
  }
}

fun List<PersistableBundle>.toBatchedPositions(): BatchedPositions = if (isEmpty()) {
  BatchedPositions(null, "Empty persistable bundle.")
} else if (first().containsKey("error")) {
  BatchedPositions(null, first().getString("error"))
} else {
  BatchedPositions(
    map { it.toPosition() },
    null,
  )
}
