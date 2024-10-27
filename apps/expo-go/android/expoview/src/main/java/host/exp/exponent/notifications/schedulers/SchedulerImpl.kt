package host.exp.exponent.notifications.schedulers

import android.content.Context
import host.exp.exponent.notifications.exceptions.UnableToScheduleException
import host.exp.exponent.kernel.ExperienceKey
import host.exp.exponent.notifications.ExponentNotificationManager
import java.lang.IllegalArgumentException

class SchedulerImpl(private val schedulerModel: SchedulerModel) : Scheduler {
  private var applicationContext: Context? = null

  @Throws(UnableToScheduleException::class)
  override fun schedule(action: String?) {
    if (!schedulerModel.shouldBeTriggeredByAction(action)) {
      return
    }
    val nextAppearanceTime = try {
      schedulerModel.nextAppearanceTime
    } catch (e: IllegalArgumentException) {
      throw UnableToScheduleException()
    }
    val experienceKey = schedulerModel.ownerExperienceKey
    val notificationId = schedulerModel.notificationId
    val details = schedulerModel.getDetailsMap()

    try {
      manager.schedule(experienceKey, notificationId, details, nextAppearanceTime, null)
    } catch (e: ClassNotFoundException) {
      e.printStackTrace()
    }
  }

  override val idAsString: String
    get() = schedulerModel.idAsString
  override val ownerExperienceKey: ExperienceKey
    get() = schedulerModel.ownerExperienceKey

  override fun cancel() {
    val experienceKey = schedulerModel.ownerExperienceKey
    val notificationId = schedulerModel.notificationId
    manager.cancel(experienceKey, notificationId)
  }

  override fun canBeRescheduled(): Boolean {
    return schedulerModel.canBeRescheduled()
  }

  override fun saveAndGetId(): String {
    return schedulerModel.saveAndGetId()
  }

  override fun setApplicationContext(context: Context) {
    applicationContext = context.applicationContext
  }

  override fun remove() {
    cancel()
    schedulerModel.remove()
  }

  private val manager: ExponentNotificationManager
    get() = ExponentNotificationManager(applicationContext!!)
}
