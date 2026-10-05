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
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.BackgroundUpdatesParameters
import expo.modules.location.next.locationProviders.toBackgroundUpdatesParameters
import java.util.concurrent.ConcurrentHashMap

abstract class LocationTaskConsumer(
  context: Context,
  taskManagerUtils: TaskManagerUtilsInterface?
) : TaskConsumer(context, taskManagerUtils) {
  @Volatile
  var task: TaskInterface? = null
  @Volatile
  var pendingIntent: PendingIntent? = null

  private val currentOptions: BackgroundUpdatesParameters
    get() = (task?.options ?: emptyMap()).toBackgroundUpdatesParameters()

  override fun taskType(): String = "location"

  final override fun didRegister(registeredTask: TaskInterface?) {
    val registered = registeredTask ?: return
    task = registered
    val newPendingIntent = taskManagerUtils.createTaskIntent(context, registered)
    val started = requestLocationUpdates(newPendingIntent, currentOptions)
    if (started) {
      pendingIntent = newPendingIntent
    }
    statuses[registered.name] = statuses.getOrDefault(registered.name, BackgroundTaskStatus()).copy(isRunning = started)
  }

  protected fun reportRequestFailed(cause: Throwable) {
    val name = task?.name ?: return
    statuses[name] = statuses.getOrDefault(name, BackgroundTaskStatus())
      .copy(isRunning = false, lastError = cause.message ?: cause.toString())
  }

  abstract fun requestLocationUpdates(pendingIntent: PendingIntent, options: BackgroundUpdatesParameters, updateExisting: Boolean = false): Boolean

  final override fun didUnregister() {
    task?.let { statuses.remove(it.name) }
    task = null
    pendingIntent?.let { stopLocationUpdates(it) }
    pendingIntent = null
  }

  abstract fun stopLocationUpdates(pendingIntent: PendingIntent)

  final override fun setOptions(options: MutableMap<String, Any>?) {
    val currentTask = task ?: return
    pendingIntent?.let {
      val started = requestLocationUpdates(it, currentOptions, updateExisting = true)
      statuses[currentTask.name] = statuses.getOrDefault(currentTask.name, BackgroundTaskStatus()).copy(isRunning = started)
    }
  }

  final override fun didReceiveBroadcast(intent: Intent?) {
    val currentTask = task ?: return
    val locationData = decodeBatchedPositions(intent)
    if (locationData.data == null && locationData.error == null) {
      return
    }

    locationData.data?.lastOrNull()?.let {
      statuses[currentTask.name] = statuses.getOrDefault(currentTask.name, BackgroundTaskStatus())
        .copy(isRunning = true, lastFixAt = it.timestamp)
    }

    if (LocationModuleNext.modulesStarted.get() > 0) {
      currentTask.execute(locationData.toBundle(), null)
    } else {
      runCatching {
        taskManagerUtils.scheduleJob(context, currentTask, locationData.toPersistableBundleList())
      }
    }
  }
  abstract fun decodeBatchedPositions(intent: Intent?): BatchedPositions

  final override fun didExecuteJob(jobService: JobService?, params: JobParameters?): Boolean {
    val currentTask = task ?: return false
    val locationData = taskManagerUtils.extractDataFromJobParams(params).toBatchedPositions()
    currentTask.execute(locationData.toBundle(), null) {
      jobService?.jobFinished(params, false)
    }
    return true
  }

  companion object {
    private val statuses = ConcurrentHashMap<String, BackgroundTaskStatus>()

    fun statusOf(taskName: String, isRegistered: Boolean) =
      statuses.getOrDefault(taskName, BackgroundTaskStatus()).copy(isRegistered = isRegistered)
  }
}

class BackgroundLocationHandle(
  val taskName: String,
  @Volatile
  var profile: LocationProfile,
) : SharedObject()

@OptimizedRecord
data class BackgroundTaskStatus(
  @Field val isRegistered: Boolean = false,
  @Field val isRunning: Boolean = false,
  @Field val lastError: String? = null,
  @Field val lastFixAt: Double? = null
) : Record

class BatchedPositions(
  @Field val data: List<Position>? = null,
  @Field val error: String? = null
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
    null
  )
}
