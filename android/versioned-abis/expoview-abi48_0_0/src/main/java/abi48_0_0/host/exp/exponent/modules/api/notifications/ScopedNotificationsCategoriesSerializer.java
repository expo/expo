package abi48_0_0.host.exp.exponent.modules.api.notifications;

import androidx.annotation.NonNull;
import abi48_0_0.expo.modules.notifications.notifications.categories.serializers.ExpoNotificationsCategoriesSerializer;
import expo.modules.notifications.notifications.model.NotificationCategory;

public class ScopedNotificationsCategoriesSerializer extends ExpoNotificationsCategoriesSerializer {
  @Override
  protected String getIdentifier(@NonNull NotificationCategory category) {
    return ScopedNotificationsIdUtils.getUnscopedId(super.getIdentifier(category));
  }
}
