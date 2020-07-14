package expo.modules.notifications.notifications.service;

import host.exp.exponent.notifications.ScopedExpoNotificationsReconstructor;

public class ExpoNotificationSchedulerService extends NotificationSchedulerService {

  @Override
  protected NotificationsHelper createNotificationHelper() {
    return new NotificationsHelper(this, new ScopedExpoNotificationsReconstructor());
  }

}
