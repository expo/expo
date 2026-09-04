package expo.modules.taskManager

import android.content.Context
import android.os.Bundle
import java.lang.ref.WeakReference
import org.junit.After
import org.junit.Assert.assertSame
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.Shadows.shadowOf

@RunWith(RobolectricTestRunner::class)
class TaskManagerPackageTest {
  @After
  fun tearDown() {
    TaskManagerPackage.mTaskService = null
  }

  @Test
  fun `getTaskServiceImpl refreshes the context of an already-created TaskService`() {
    val context = RuntimeEnvironment.getApplication()

    // TasksAndEventsRepository.create() reads application metadata to pick a storage
    // strategy; Robolectric's default package has none, so give it an empty Bundle.
    shadowOf(context.packageManager).getInternalMutablePackageInfo(context.packageName)
      .applicationInfo!!.metaData = Bundle()

    val pkg = TaskManagerPackage()
    val taskService = pkg.getTaskServiceImpl(context) as TaskService

    // Simulate the original context having been garbage collected, which happens when
    // the Activity/ReactContext that created this singleton is destroyed (e.g. the app
    // is killed and reopened) while the process itself survives.
    setContextRef(taskService, WeakReference<Context>(null))

    // A later call, e.g. after the app relaunches, must hand the singleton a live context
    // again instead of leaving it stuck with the collected one.
    pkg.getTaskServiceImpl(context)

    assertSame(context, contextRef(taskService))
  }

  private fun setContextRef(taskService: TaskService, ref: WeakReference<Context>) {
    val field = TaskService::class.java.getDeclaredField("mContextRef")
    field.isAccessible = true
    field.set(taskService, ref)
  }

  private fun contextRef(taskService: TaskService): Context? {
    val field = TaskService::class.java.getDeclaredField("mContextRef")
    field.isAccessible = true
    @Suppress("UNCHECKED_CAST")
    return (field.get(taskService) as WeakReference<Context>).get()
  }
}
