package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.model.NotificationResponse;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsEmitter extends NotificationsEmitter {
  private ExperienceId mExperienceId;

  public ScopedNotificationsEmitter(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  public void onNotificationReceived(Notification notification) {
    if (shouldHandleNotification(notification)) {
      super.onNotificationReceived(notification);
    }
  }

  @Override
  public void onNotificationResponseReceived(NotificationResponse response) {
    if (shouldHandleNotification(response.getNotification())) {
      super.onNotificationResponseReceived(response);
    }
  }

  private boolean shouldHandleNotification(Notification notification) {
    NotificationRequest notificationRequest = notification.getNotificationRequest();
    if (notificationRequest instanceof ScopedNotificationRequest) {
      ScopedNotificationRequest scopedNotificationRequest = (ScopedNotificationRequest) notificationRequest;
      return scopedNotificationRequest.checkIfBelongsToExperience(mExperienceId);
    }

    return true;
  }
}
