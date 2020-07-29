package expo.modules.notifications.notifications.interfaces;

import android.content.Context;

import androidx.annotation.NonNull;
import expo.modules.notifications.notifications.service.SharedPreferencesNotificationCategoriesStore;

public interface NotificationsBuilderCreator {

  NotificationBuilder get(Context context, @NonNull SharedPreferencesNotificationCategoriesStore store);

}
