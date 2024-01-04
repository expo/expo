package host.exp.exponent.notifications.schedulers

import android.content.Context
import host.exp.exponent.notifications.exceptions.UnableToScheduleException
import host.exp.exponent.kernel.ExperienceKey

interface Scheduler {
  @Throws(UnableToScheduleException::class)
  fun schedule(action: String?)
  val idAsString: String
  val ownerExperienceKey: ExperienceKey
  fun cancel()
  fun canBeRescheduled(): Boolean
  fun saveAndGetId(): String
  fun setApplicationContext(context: Context)
  fun remove()
}
