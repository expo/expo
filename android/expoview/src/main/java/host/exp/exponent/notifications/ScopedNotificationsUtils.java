package host.exp.exponent.notifications;

import androidx.annotation.Nullable;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsUtils {
  public static boolean shouldHandleNotification(Notification notification, ExperienceId experienceId) {
    return shouldHandleNotification(notification.getNotificationRequest(), experienceId);
  }

  public static boolean shouldHandleNotification(NotificationRequest notificationRequest, ExperienceId experienceId) {
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.checkIfBelongsToExperience(experienceId);
    }

    return true;
  }

  public static String getExperienceId(@Nullable NotificationResponse notificationResponse) {
    if (notificationResponse == null || notificationResponse.getNotification() == null) {
      return null;
    }

    NotificationRequest notificationRequest = notificationResponse.getNotification().getNotificationRequest();
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.getExperienceIdString();
    }

    return null;
  }
}
