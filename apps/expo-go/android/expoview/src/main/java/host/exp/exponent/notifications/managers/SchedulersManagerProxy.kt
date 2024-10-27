package host.exp.exponent.notifications.managers

import android.content.Context
import expo.modules.core.interfaces.Function
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.schedulers.*
import java.util.concurrent.Executor
import java.util.concurrent.Executors

class SchedulersManagerProxy private constructor(private val schedulersManager: SchedulersManager) : SchedulersManager {
  private val singleThreadExecutor: Executor = Executors.newSingleThreadExecutor()

  override fun triggerAll(action: String?) {
    singleThreadExecutor.execute { schedulersManager.triggerAll(action) }
  }

  override fun removeAll(experienceKey: ExperienceKey?) {
    singleThreadExecutor.execute { schedulersManager.removeAll(experienceKey) }
  }

  override fun cancelAlreadyScheduled(experienceKey: ExperienceKey?) {
    singleThreadExecutor.execute { schedulersManager.cancelAlreadyScheduled(experienceKey) }
  }

  override fun rescheduleOrDelete(id: String?) {
    singleThreadExecutor.execute { schedulersManager.rescheduleOrDelete(id) }
  }

  override fun removeScheduler(id: String?) {
    singleThreadExecutor.execute { schedulersManager.removeScheduler(id) }
  }

  override fun addScheduler(scheduler: Scheduler, handler: Function<String, Boolean>) {
    singleThreadExecutor.execute { schedulersManager.addScheduler(scheduler, handler) }
  }

  companion object {
    const val SCHEDULER_ID = "scheduler_id"

    @Volatile private var instance: SchedulersManager? = null

    @Synchronized
    @JvmStatic fun getInstance(context: Context): SchedulersManager {
      if (instance == null) {
        instance = SchedulersManagerProxy(SchedulerManagerImpl(context.applicationContext))
      }
      return instance!!
    }
  }
}
