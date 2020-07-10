package versioned.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import expo.modules.notifications.notifications.handling.NotificationsHandler;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;
import expo.modules.notifications.notifications.service.NotificationsHelper;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.ScopedNotificationsUtils;

public class ScopedNotificationsHandler extends NotificationsHandler {
  private ExperienceId mExperienceId;
  private ScopedNotificationsUtils mScopedNotificationsUtils;

  public ScopedNotificationsHandler(Context context, NotificationsHelper notificationsHelper, ExperienceId experienceId) {
    super(context, notificationsHelper);
    mExperienceId = experienceId;
    mScopedNotificationsUtils = new ScopedNotificationsUtils(context);
  }

  @Override
  public void onNotificationReceived(Notification notification) {
    if (mScopedNotificationsUtils.shouldHandleNotification(notification, mExperienceId)) {
      super.onNotificationReceived(notification);
    }
  }

  @Override
  public void onNotificationResponseReceived(NotificationResponse response) {
    if (mScopedNotificationsUtils.shouldHandleNotification(response.getNotification(), mExperienceId)) {
      super.onNotificationResponseReceived(response);
    }
  }
}
