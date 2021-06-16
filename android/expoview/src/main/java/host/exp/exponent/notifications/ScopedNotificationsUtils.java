package host.exp.exponent.notifications;

import android.content.Context;
import android.util.Pair;

import androidx.annotation.Nullable;

import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.service.delegates.ExpoPresentationDelegate;
import host.exp.exponent.kernel.ExperienceKey;
import host.exp.exponent.notifications.model.ScopedNotificationRequest;

import static host.exp.exponent.experience.ExperienceActivity.PERSISTENT_EXPONENT_NOTIFICATION_ID;

public class ScopedNotificationsUtils {
  private ExponentNotificationManager mExponentNotificationManager;

  public ScopedNotificationsUtils(Context context) {
    mExponentNotificationManager = new ExponentNotificationManager(context);
  }

  public boolean shouldHandleNotification(Notification notification, ExperienceKey experienceKey) {
    return shouldHandleNotification(notification.getNotificationRequest(), experienceKey);
  }

  public boolean shouldHandleNotification(NotificationRequest notificationRequest, ExperienceKey experienceKey) {
    // expo-notifications notification
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.checkIfBelongsToExperience(experienceKey);
    }

    // legacy or foreign notification
    Pair<String, Integer> foreignNotification = ExpoPresentationDelegate.Companion.parseNotificationIdentifier(notificationRequest.getIdentifier());
    if (foreignNotification != null) {
      @Nullable String foreignNotificationExperienceScopeKey = foreignNotification.first;
      @Nullable ExperienceKey foreignNotificationExperienceKey = foreignNotificationExperienceScopeKey != null ? new ExperienceKey(foreignNotificationExperienceScopeKey) : null;
      boolean notificationBelongsToSomeExperience = foreignNotificationExperienceKey != null && mExponentNotificationManager.getAllNotificationsIds(foreignNotificationExperienceKey).contains(foreignNotification.second);
      boolean notificationExperienceIsCurrentExperience = foreignNotificationExperienceKey != null && experienceKey.getScopeKey().equals(foreignNotificationExperienceKey.getScopeKey());
      boolean notificationIsPersistentExponentNotification = foreignNotificationExperienceScopeKey == null && foreignNotification.second == PERSISTENT_EXPONENT_NOTIFICATION_ID;
      // If notification doesn't belong to any experience it's a foreign notification
      // and we want to deliver it to all the experiences. If it does belong to some experience,
      // we want to handle it only if it belongs to "current" experience. If it is the persistent
      // Exponent notification do not pass it to any experience.
      return !notificationIsPersistentExponentNotification && (!notificationBelongsToSomeExperience || notificationExperienceIsCurrentExperience);
    }

    // fallback
    return true;
  }

  public static String getExperienceScopeKey(@Nullable NotificationResponse notificationResponse) {
    if (notificationResponse == null || notificationResponse.getNotification() == null) {
      return null;
    }

    NotificationRequest notificationRequest = notificationResponse.getNotification().getNotificationRequest();
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.getExperienceScopeKeyString();
    }

    return null;
  }
}
