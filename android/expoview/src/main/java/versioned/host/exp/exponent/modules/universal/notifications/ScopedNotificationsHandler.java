package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import expo.modules.notifications.notifications.handling.NotificationsHandler;
import expo.modules.notifications.notifications.model.Notification;
import host.exp.exponent.kernel.ExperienceId;

public class ScopedNotificationsHandler extends NotificationsHandler {
  private ExperienceId mExperienceId;

  public ScopedNotificationsHandler(Context context, ExperienceId experienceId) {
    super(context);
    mExperienceId = experienceId;
  }

  @Override
  public void onNotificationReceived(Notification notification) {
    if (ScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceId)) {
      super.onNotificationReceived(notification);
    }
  }
}
