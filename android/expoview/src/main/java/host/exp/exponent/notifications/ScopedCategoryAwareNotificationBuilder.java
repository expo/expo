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
import expo.modules.notifications.notifications.service.SharedPreferencesNotificationCategoriesStore;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;
import versioned.host.exp.exponent.modules.api.notifications.ScopedNotificationsIdUtils;

public class ScopedCategoryAwareNotificationBuilder extends ScopedExpoNotificationBuilder {

  public ScopedCategoryAwareNotificationBuilder(Context context, @NonNull SharedPreferencesNotificationCategoriesStore store) {
    super(context, store);
  }

  @Override
  protected NotificationCompat.Builder createBuilder() {
    NotificationCompat.Builder builder = super.createBuilder();

    NotificationContent content = getNotificationContent();

    if (content.getCategoryId() != null) {
      NotificationRequest requester = getNotification().getNotificationRequest();
      String scopedCategoryIdentifier = ScopedNotificationsIdUtils.getScopedCategoryId(ExperienceId.create(((ScopedNotificationRequest) requester).getExperienceIdString()), content.getCategoryId());
      List<NotificationAction> actions = Collections.emptyList();
      try {
        NotificationCategory category = super.mStore.getNotificationCategory(scopedCategoryIdentifier);
        if (category != null) {
          actions = category.getActions();
        }
      } catch (ClassNotFoundException | IOException e) {
        Log.e("expo-notifications", String.format("Could not read category with identifier: %s. %s", scopedCategoryIdentifier, e.getMessage()));
        e.printStackTrace();
      }
      for (NotificationAction action : actions) {
        if (action instanceof TextInputNotificationAction) {
          builder.addAction(super.buildTextInputAction((TextInputNotificationAction) action));
        } else {
          builder.addAction(super.buildButtonAction(action));
        }
      }
    }

    return builder;
  }
}
