package abi40_0_0.host.exp.exponent.modules.universal.notifications;

import android.content.Context;

import abi40_0_0.expo.modules.notifications.notifications.handling.NotificationsHandler;
import expo.modules.notifications.notifications.model.Notification;
import expo.modules.notifications.notifications.model.NotificationResponse;
import host.exp.exponent.kernel.ExperienceId;
import host.exp.exponent.notifications.ScopedNotificationsUtils;

public class ScopedNotificationsHandler extends NotificationsHandler {
  private ExperienceId mExperienceId;
  private ScopedNotificationsUtils mScopedNotificationsUtils;

  public ScopedNotificationsHandler(Context context, ExperienceId experienceId) {
    super(context);
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
  public boolean onNotificationResponseReceived(NotificationResponse response) {
    if (mScopedNotificationsUtils.shouldHandleNotification(response.getNotification(), mExperienceId)) {
      return super.onNotificationResponseReceived(response);
    }
    return false;
  }
}
