package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import expo.modules.notifications.notifications.emitting.NotificationsEmitter;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.ScopedNotificationsUtils;

public class ScopedNotificationsEmitter extends NotificationsEmitter {
  private ExperienceId mExperienceId;

  public ScopedNotificationsEmitter(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  public void onNotificationReceived(Notification notification) {
    if (ScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceId)) {
      super.onNotificationReceived(notification);
    }
  }

  @Override
  public void onNotificationResponseReceived(NotificationResponse response) {
    if (ScopedNotificationsUtils.shouldHandleNotification(response.getNotification(), mExperienceId)) {
      super.onNotificationResponseReceived(response);
    }
  }
}
