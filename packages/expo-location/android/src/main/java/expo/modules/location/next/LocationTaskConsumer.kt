package expo.modules.location.next

import android.app.PendingIntent
import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.content.Intent
import android.os.PersistableBundle
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.sharedobjects.SharedObject
import expo.modules.kotlin.types.OptimizedRecord
import expo.modules.location.next.locationProviders.BackgroundUpdatesParameters
import expo.modules.location.next.locationProviders.LocationProvider
import expo.modules.location.next.locationProviders.ProviderResult
import expo.modules.location.next.locationProviders.toBackgroundUpdatesParameters
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicInteger

abstract class LocationTaskConsumer(
  context: Context,
  taskManagerUtils: TaskManagerUtilsInterface?
) : TaskConsumer(context, taskManagerUtils) {
  @Volatile
  var task: TaskInterface? = null

  @Volatile
  protected var pendingIntent: PendingIntent? = null

  private val currentOptions: BackgroundUpdatesParameters
    get() = (task?.options ?: emptyMap()).toBackgroundUpdatesParameters()

  override fun taskType(): String = "location"

  final override fun didRegister(registeredTask: TaskInterface?) {
    task = registeredTask ?: return

    val newPendingIntent = taskManagerUtils.createTaskIntent(context, registeredTask)
    pendingIntent = newPendingIntent

    val started = requestLocationUpdates(newPendingIntent, currentOptions)

    statuses.compute(registeredTask.name) { _, previousStatus ->
      val status = previousStatus ?: BackgroundTaskStatus()
      status.copy(
        isRunning = started,
        lastError = if (started) {
          null
        } else {
          status.lastError
        }
      )
    }
  }

  protected fun reportRequestFailed(cause: Throwable) {
    val name = task?.name ?: return
    statuses.compute(name) { _, previousStatus ->
      (previousStatus ?: BackgroundTaskStatus())
        .copy(isRunning = false, lastError = cause.message ?: cause.toString())
    }
  }

  abstract fun requestLocationUpdates(
    pendingIntent: PendingIntent,
    options: BackgroundUpdatesParameters,
    updateExisting: Boolean = false
  ): Boolean

  final override fun didUnregister() {
    task?.let { statuses.remove(it.name) }
    task = null
    pendingIntent?.let { stopLocationUpdates(it) }
    pendingIntent = null
  }

  abstract fun stopLocationUpdates(pendingIntent: PendingIntent)

  final override fun setOptions(options: MutableMap<String, Any>?) {
    val currentTask = task ?: return
    val pendingIntentNow = pendingIntent ?: return
    val started = requestLocationUpdates(pendingIntentNow, currentOptions, updateExisting = true)

    statuses.compute(currentTask.name) { _, previousStatus ->
      val status = previousStatus ?: BackgroundTaskStatus()
      status.copy(
        isRunning = started,
        lastError = if (started) {
          null
        } else {
          status.lastError
        }
      )
    }
  }

  final override fun didReceiveBroadcast(intent: Intent?) {
    val currentTask = task ?: return
    val locationData = decodeBatchedPositions(intent)
    if (locationData.data == null && locationData.error == null) {
      return
    }

    locationData.data?.lastOrNull()?.let { position ->
      statuses.compute(currentTask.name) { _, previousStatus ->
        (previousStatus ?: BackgroundTaskStatus())
          .copy(isRunning = true, lastFixAt = position.timestamp, lastError = null)
      }
    }

    if (LocationModuleNext.modulesStarted.get() > 0) {
      locationData.error?.let { currentTask.execute(null, Error(it)) }
      locationData.data?.forEach { currentTask.execute(it.toBundle(), null) }
    } else {
      runCatching {
        taskManagerUtils.scheduleJob(context, currentTask, locationData.toPersistableBundleList())
      }.onFailure { reportRequestFailed(it) }
    }
  }
  abstract fun decodeBatchedPositions(intent: Intent?): BatchedPositions
  
  final override fun didExecuteJob(jobService: JobService?, params: JobParameters?): Boolean {
    val currentTask = task ?: return false
    val locationData = taskManagerUtils.extractDataFromJobParams(params).toBatchedPositions()
    val positions = locationData.data

    if (positions.isNullOrEmpty()) {
      currentTask.execute(null, Error(locationData.error)) {
        jobService?.jobFinished(params, false)
      }
      return true
    }

    val remainingTasks = AtomicInteger(positions.size)
    positions.forEach { position ->
      currentTask.execute(position.toBundle(), null) {
        if (remainingTasks.decrementAndGet() == 0) {
          jobService?.jobFinished(params, false)
        }
      }
    }
    return true
  }

  companion object {
    private val statuses = ConcurrentHashMap<String, BackgroundTaskStatus>()

    fun statusOf(taskName: String, isRegistered: Boolean) =
      statuses.getOrDefault(taskName, BackgroundTaskStatus()).copy(isRegistered = isRegistered)
  }
}

class LocationUpdatesHandle(
  val taskName: String,
  @Volatile
  var profile: LocationProfile,
  val locationProvider: LocationProvider
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
    mapNotNull { it.toPosition() }.takeIf { it.isNotEmpty() },
    null
  )
}

fun getExistingOrNewLocationTaskConsumer(handle: LocationUpdatesHandle, taskManager: TaskManagerInterface): ProviderResult<Class<out TaskConsumer>> {
  val existing = handle.locationProvider.getRegisteredTaskConsumerClass(taskManager, handle.taskName)
  if (existing is ProviderResult.Available) {
    return existing
  }
  return handle.locationProvider.getLocationTaskConsumerClass()
}
