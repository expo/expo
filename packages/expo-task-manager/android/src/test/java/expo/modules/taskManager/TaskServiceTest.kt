package expo.modules.taskManager

import android.content.Context
import android.os.Bundle
import androidx.test.core.app.ApplicationProvider
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import expo.modules.interfaces.taskManager.TaskManagerInterface
import io.mockk.Runs
import io.mockk.every
import io.mockk.just
import io.mockk.mockk
import io.mockk.slot
import io.mockk.unmockkAll
import org.junit.After
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class TaskServiceTest {
  @After
  fun tearDown() {
    unmockkAll()
  }

  @Test
  fun `notifyTaskFinished invokes and releases the task callback`() {
    val context = ApplicationProvider.getApplicationContext<Context>()

    // TasksAndEventsRepository.create() reads application metadata to pick a storage
    // strategy; Robolectric's default package has none, so give it an empty Bundle.
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName)
      .applicationInfo!!.metaData = Bundle()

    val taskService = TaskService(context)
    val appScopeKey = "testAppScopeKey"

    // Register a mock task manager so executeTask delivers the event body
    // synchronously instead of going through the headless app loader.
    val bodySlot = slot<Bundle>()
    val taskManager = mockk<TaskManagerInterface>(relaxed = true)
    every { taskManager.executeTaskWithBody(capture(bodySlot)) } just Runs
    taskService.setTaskManager(taskManager, appScopeKey, "appUrl")

    val task = mockk<TaskInterface>(relaxed = true)
    every { task.name } returns "testTask"
    every { task.appScopeKey } returns appScopeKey

    var finishedCount = 0
    val callback = TaskExecutionCallback { finishedCount++ }

    taskService.executeTask(task, Bundle(), null, callback)

    val eventId = bodySlot.captured.getBundle("executionInfo")!!.getString("eventId")!!
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
