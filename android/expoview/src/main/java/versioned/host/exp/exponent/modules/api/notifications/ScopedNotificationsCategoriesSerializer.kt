package versioned.host.exp.exponent.modules.api.notifications

import expo.modules.notifications.notifications.categories.serializers.ExpoNotificationsCategoriesSerializer
import expo.modules.notifications.notifications.model.NotificationCategory

class ScopedNotificationsCategoriesSerializer : ExpoNotificationsCategoriesSerializer() {
  override fun getIdentifier(category: NotificationCategory): String? {
    return ScopedNotificationsIdUtils.getUnscopedId(super.getIdentifier(category))
  }
}
