package expo.modules.notifications.notifications.categories.serializers

import android.os.Bundle
import expo.modules.notifications.notifications.model.NotificationCategory

interface NotificationsCategoriesSerializer {
  fun toBundle(category: NotificationCategory): Bundle
}
