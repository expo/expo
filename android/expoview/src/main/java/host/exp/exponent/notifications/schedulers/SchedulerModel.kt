package host.exp.exponent.notifications.schedulers

import host.exp.exponent.kernel.ExperienceKey
import java.util.*

interface SchedulerModel {
  val nextAppearanceTime: Long
  fun shouldBeTriggeredByAction(action: String?): Boolean
  val ownerExperienceKey: ExperienceKey
  val notificationId: Int
  val idAsString: String
  fun getDetailsMap(): HashMap<String, Any>?
  fun setDetailsFromMap(detailsMap: HashMap<String, Any>)
  fun canBeRescheduled(): Boolean
  fun saveAndGetId(): String
  fun remove()
}
