package versioned.host.exp.exponent.modules.api.notifications;

import androidx.annotation.NonNull;

import java.util.Collections;
import java.util.List;

import expo.modules.core.interfaces.InternalModule;
import expo.modules.notifications.notifications.categories.serializers.ExpoNotificationsCategoriesSerializer;
import expo.modules.notifications.notifications.categories.serializers.NotificationsCategoriesSerializer;
import expo.modules.notifications.notifications.model.NotificationCategory;

public class ScopedNotificationsCategoriesSerializer extends ExpoNotificationsCategoriesSerializer implements InternalModule {
  @Override
  protected String getIdentifier(@NonNull NotificationCategory category) {
    return ScopedNotificationsIdUtils.getUnscopedId(super.getIdentifier(category));
  }

  @Override
  public List<? extends Class> getExportedInterfaces() {
    // TODO vonovak refactor for expo go
    return Collections.singletonList(NotificationsCategoriesSerializer.class);
  }
}
