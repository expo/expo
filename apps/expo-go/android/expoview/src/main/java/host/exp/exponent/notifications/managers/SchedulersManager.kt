package host.exp.exponent.notifications.managers

import expo.modules.core.interfaces.Function
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.schedulers.Scheduler

interface SchedulersManager {
  fun triggerAll(action: String?)
  fun removeAll(experienceKey: ExperienceKey?)
  fun cancelAlreadyScheduled(experienceKey: ExperienceKey?)
  fun rescheduleOrDelete(id: String?)
  fun removeScheduler(id: String?)
  fun addScheduler(scheduler: Scheduler, handler: Function<String, Boolean>)
}
