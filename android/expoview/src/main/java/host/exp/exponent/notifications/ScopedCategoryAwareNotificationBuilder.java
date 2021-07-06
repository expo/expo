package host.exp.exponent.notifications;

import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import expo.modules.notifications.notifications.model.NotificationAction;
import expo.modules.notifications.notifications.model.NotificationCategory;
import expo.modules.notifications.notifications.model.NotificationContent;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.TextInputNotificationAction;
import expo.modules.notifications.service.delegates.SharedPreferencesNotificationCategoriesStore;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

public class ScopedCategoryAwareNotificationBuilder extends ScopedExpoNotificationBuilder {

  public ScopedCategoryAwareNotificationBuilder(Context context, @NonNull SharedPreferencesNotificationCategoriesStore store) {
    super(context, store);
  }

  @Override
  protected void addActionsToBuilder(NotificationCompat.Builder builder, @NonNull String categoryIdentifier) {
    NotificationRequest requester = getNotification().getNotificationRequest();
    NotificationContent content = getNotificationContent();
    String scopedCategoryIdentifier;

    if (requester instanceof ScopedNotificationRequest) {
      scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryIdRaw(((ScopedNotificationRequest) requester).getExperienceScopeKeyString(), content.getCategoryId());
    } else {
      scopedCategoryIdentifier = content.getCategoryId();
    }

    super.addActionsToBuilder(builder, scopedCategoryIdentifier);
  }
}
