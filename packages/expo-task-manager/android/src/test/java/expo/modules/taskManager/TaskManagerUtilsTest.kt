package expo.modules.taskManager

import android.app.job.JobScheduler
import android.content.Context
import android.os.Bundle
import android.os.PersistableBundle
import expo.modules.interfaces.taskManager.TaskConsumerInterface
import expo.modules.interfaces.taskManager.TaskExecutionCallback
import expo.modules.interfaces.taskManager.TaskInterface
import org.junit.Assert.assertEquals
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

// API 28 is the last level where JobInfo.Builder.build() rejects a job with no constraint
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [28])
class TaskManagerUtilsTest {
  private fun stubTask() = object : TaskInterface {
    override fun getName() = "testTask"
    override fun getAppScopeKey() = "testAppScopeKey"
    override fun getAppUrl() = "appUrl"
    override fun getConsumer(): TaskConsumerInterface? = null
    override fun getOptions(): Map<String, Any>? = null
    override fun getOptionsBundle(): Bundle? = null
    override fun execute(data: Bundle?, error: Error?) = Unit
    override fun execute(data: Bundle?, error: Error?, callback: TaskExecutionCallback?) = Unit
    override fun setOptions(options: Map<String, Any>?) = Unit
  }

  @Test
  fun `scheduleJob schedules a job that the system accepts`() {
    val context = RuntimeEnvironment.getApplication()

    TaskManagerUtils().scheduleJob(context, stubTask(), listOf(PersistableBundle()))

    val jobScheduler = context.getSystemService(Context.JOB_SCHEDULER_SERVICE) as JobScheduler
    assertEquals(1, jobScheduler.allPendingJobs.size)
  }
}
