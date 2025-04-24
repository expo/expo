package expo.modules.notifications.notifications.model

import android.os.Parcelable
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.notifications.notifications.enums.NotificationPriority
import kotlinx.parcelize.Parcelize

@Parcelize
data class NotificationBehaviorRecord(
  @Field val shouldShowAlert: Boolean = false,
  @Field val shouldShowBanner: Boolean = false,
  @Field val shouldShowList: Boolean = false,
  @Field val shouldPlaySound: Boolean = false,
  @Field val shouldSetBadge: Boolean = false,
  @Field val priority: String? = null
) : Record, Parcelable {

  val priorityOverride: NotificationPriority? get() {
    return priority?.let { NotificationPriority.fromEnumValue(it) }
  }

  val shouldPresentAlert: Boolean get() {
    return shouldShowBanner || shouldShowList || shouldShowAlert
  }
}
