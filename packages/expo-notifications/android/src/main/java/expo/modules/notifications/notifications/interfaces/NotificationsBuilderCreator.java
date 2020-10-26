package expo.modules.notifications.notifications.interfaces;

import android.content.Context;

import androidx.annotation.NonNull;
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore;

@FunctionalInterface
public interface NotificationsBuilderCreator {

  NotificationBuilder get(Context context, @NonNull SharedPreferencesNotificationCategoriesStore store);

}
