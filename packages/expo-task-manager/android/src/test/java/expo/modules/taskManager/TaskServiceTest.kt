package expo.modules.taskManager

import android.os.Bundle
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class TaskServiceTest {
  @Test
  fun `notifyTaskFinished invokes and releases the task callback`() {
    val context = RuntimeEnvironment.getApplication()

    // TasksAndEventsRepository.create() reads application metadata to pick a storage
    // strategy; Robolectric's default package has none, so give it an empty Bundle.
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName)
      .applicationInfo!!.metaData = Bundle()

    val taskService = TaskService(context)
    val appScopeKey = "testAppScopeKey"

    // Register a task manager so executeTask delivers the event body
    // synchronously instead of going through the headless app loader.
    var capturedBody: Bundle? = null
    val taskManager = object : TaskManagerInterface {
      override fun registerTask(taskName: String, consumerClass: Class<*>, options: Map<String, Any>) = Unit
      override fun unregisterTask(taskName: String, consumerClass: Class<*>) = Unit
      override fun executeTaskWithBody(body: Bundle) {
        capturedBody = body
      }
      override fun taskHasConsumerOfClass(taskName: String, consumerClass: Class<*>) = false
      override fun flushQueuedEvents() = Unit
      override fun getAppScopeKey() = appScopeKey
    }
    taskService.setTaskManager(taskManager, appScopeKey, "appUrl")

    val task = object : TaskInterface {
      override fun getName() = "testTask"
      override fun getAppScopeKey() = appScopeKey
      override fun getAppUrl() = "appUrl"
      override fun getConsumer(): TaskConsumerInterface? = null
      override fun getOptions(): Map<String, Any>? = null
      override fun getOptionsBundle(): Bundle? = null
      override fun execute(data: Bundle?, error: Error?) = Unit
      override fun execute(data: Bundle?, error: Error?, callback: TaskExecutionCallback?) = Unit
      override fun setOptions(options: Map<String, Any>?) = Unit
    }

    var finishedCount = 0
    val callback = TaskExecutionCallback { finishedCount++ }

    taskService.executeTask(task, Bundle(), null, callback)

    val eventId = capturedBody!!.getBundle("executionInfo")!!.getString("eventId")!!
    taskService.notifyTaskFinished("testTask", appScopeKey, mapOf<String, Any>("eventId" to eventId))

    assertEquals(1, finishedCount)

    // The callback must be released after execution — otherwise it retains the
    // JobService and JobParameters it closes over, for the lifetime of the process.
    assertFalse(taskCallbacksMap().containsKey(eventId))
  }

  private fun taskCallbacksMap(): Map<*, *> {
    val field = TaskService::class.java.getDeclaredField("sTaskCallbacks")
    field.isAccessible = true
    return field.get(null) as Map<*, *>
  }
}
