package host.exp.exponent.notifications.managers

import android.content.Context
import com.raizlabs.android.dbflow.sql.language.SQLite
import expo.modules.core.interfaces.Function
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.exceptions.UnableToScheduleException
import host.exp.exponent.notifications.schedulers.*

internal class SchedulerManagerImpl(private val applicationContext: Context) : SchedulersManager {
  private var fetchedFromDB = false
  private val schedulersMap = mutableMapOf<String, Scheduler>()

  override fun triggerAll(action: String?) {
    fetchSchedulersMap()

    cancelAlreadyScheduled(null)

    val unsuccessful = mutableListOf<String>()
    for ((key, value) in schedulersMap) {
      try {
        value.schedule(action)
      } catch (e: UnableToScheduleException) {
        unsuccessful.add(key)
      }
    }

    for (key in unsuccessful) {
      removeScheduler(key)
    }
  }

  override fun removeAll(experienceKey: ExperienceKey?) {
    fetchSchedulersMap()

    cancelAlreadyScheduled(experienceKey)

    val toRemove = mutableListOf<String>()
    for ((key, value) in schedulersMap) {
      if (experienceKey == null || value.ownerExperienceKey == experienceKey) {
        value.remove()
        toRemove.add(key)
      }
    }

    for (key in toRemove) {
      schedulersMap.remove(key)
    }
  }

  override fun cancelAlreadyScheduled(experienceKey: ExperienceKey?) {
    fetchSchedulersMap()

    for (scheduler in schedulersMap.values) {
      if (experienceKey == null || scheduler.ownerExperienceKey == experienceKey) {
        scheduler.cancel()
      }
    }
  }

  override fun rescheduleOrDelete(id: String?) {
    fetchSchedulersMap()

    val scheduler = schedulersMap[id] ?: return
    if (!scheduler.canBeRescheduled()) {
      removeScheduler(id)
    } else {
      try {
        scheduler.schedule(null)
      } catch (e: UnableToScheduleException) {
        removeScheduler(id)
      }
    }
  }

  override fun removeScheduler(id: String?) {
    fetchSchedulersMap()

    schedulersMap.remove(id)?.apply {
      cancel()
      remove()
    }
  }

  override fun addScheduler(scheduler: Scheduler, handler: Function<String, Boolean>) {
    fetchSchedulersMap()

    scheduler.setApplicationContext(applicationContext)

    val id = scheduler.saveAndGetId()
    schedulersMap[id] = scheduler
    val idToApply = try {
      scheduler.schedule(null)
      id
    } catch (e: UnableToScheduleException) {
      removeScheduler(id)
      null
    }

    handler.apply(idToApply)
  }

  private fun fetchSchedulersMap() {
    if (!fetchedFromDB) {
      fetchedFromDB = true

      val calendarSchedulers: List<SchedulerModel> = SQLite.select().from(CalendarSchedulerModel::class.java).queryList()
      val intervalSchedulers: List<SchedulerModel> = SQLite.select().from(IntervalSchedulerModel::class.java).queryList()
      for (schedulerModel in calendarSchedulers + intervalSchedulers) {
        val scheduler = SchedulerImpl(schedulerModel)
        schedulersMap[scheduler.idAsString] = scheduler
      }

      for (scheduler in schedulersMap.values) {
        scheduler.setApplicationContext(applicationContext)
      }
    }
  }
}
