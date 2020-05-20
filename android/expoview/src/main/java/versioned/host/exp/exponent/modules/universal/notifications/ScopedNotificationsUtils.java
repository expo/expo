package versioned.host.exp.exponent.modules.universal.notifications;

import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsUtils {
  static boolean shouldHandleNotification(Notification notification, ExperienceId experienceId) {
    return shouldHandleNotification(notification.getNotificationRequest(), experienceId);
  }

  static boolean shouldHandleNotification(NotificationRequest notificationRequest, ExperienceId experienceId) {
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.checkIfBelongsToExperience(experienceId);
    }

    return true;
  }

  public static String getExperienceId(NotificationResponse notificationResponse) {
    NotificationRequest notificationRequest = notificationResponse.getNotification().getNotificationRequest();
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.getExperienceIdString();
    }

    return null;
  }
}
