package expo.modules.notifications.notifications.background

import android.app.job.JobParameters
import android.app.job.JobService
import android.content.Context
import android.os.Bundle
import android.util.Log
import expo.modules.interfaces.taskManager.TaskConsumer
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerUtilsInterface
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate.Companion.addBackgroundTaskConsumer
import expo.modules.notifications.service.delegates.FirebaseMessagingDelegate.Companion.removeBackgroundTaskConsumer
import org.json.JSONException
import org.json.JSONObject

/**
 * Represents a task to be run when the app receives a remote push
 * notification. Set of current tasks is maintained in [FirebaseMessagingDelegate].
 *
 * Instances are instantiated by expo task manager, after being registered in ExpoBackgroundNotificationTasksModule
 */
class BackgroundRemoteNotificationTaskConsumer(
  context: Context?,
  taskManagerUtils: TaskManagerUtilsInterface?
) : TaskConsumer(context, taskManagerUtils), TaskConsumerInterface {

  private var task: TaskInterface? = null

  init {
    addBackgroundTaskConsumer(this)
  }

  override fun taskType() = "remote-notification"

  override fun didRegister(task: TaskInterface?) {
    this.task = task
  }

  override fun didUnregister() {
    removeBackgroundTaskConsumer(this)
    task = null
  }

  override fun didExecuteJob(jobService: JobService, params: JobParameters?): Boolean {
    val task = task ?: return false

    for (item in taskManagerUtils.extractDataFromJobParams(params)) {
      val notificationEntry = requireNotNull(item.getString(NOTIFICATION_KEY)) { "Job data missing '$NOTIFICATION_KEY' entry" }
      val bundle = Bundle().apply {
        putBundle(NOTIFICATION_KEY, jsonStringToBundle(notificationEntry))
      }
      task.execute(bundle, null) { jobService.jobFinished(params, false) }
    }

    // Returning `true` indicates that the job is still running, but in async mode.
    // In that case we're obligated to call `jobService.jobFinished` as soon as the async block finishes.
    return true
  }

  fun executeTask(bundle: Bundle) {
    requireNotNull(task) { "executeTask called but no task is registered" }.execute(bundle, null)
  }

  companion object {
    private const val NOTIFICATION_KEY = "notification"

    private fun bundleToJson(bundle: Bundle): JSONObject {
      val json = JSONObject()
      for (key in bundle.keySet()) {
        try {
          val value = bundle.get(key)
          if (value is Bundle) {
            json.put(key, bundleToJson(value))
          } else {
            json.put(key, JSONObject.wrap(value))
          }
        } catch (e: JSONException) {
          Log.e("expo-notifications", "Could not create JSON object from notification bundle. ${e.message}")
        }
      }
      return json
    }

    private fun jsonStringToBundle(jsonString: String): Bundle? =
      try {
        NotificationSerializer.toBundle(JSONObject(jsonString))
      } catch (e: JSONException) {
        Log.e("expo-notifications", "Could not parse notification from JSON string. ${e.message}")
        null
      }
  }
}
