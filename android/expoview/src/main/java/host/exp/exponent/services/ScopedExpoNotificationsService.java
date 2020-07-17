package host.exp.exponent.services;

import android.app.Notification;
import android.os.Parcel;

import expo.modules.notifications.notifications.model.NotificationBehavior;
import expo.modules.notifications.notifications.model.NotificationRequest;
import expo.modules.notifications.notifications.service.ExpoNotificationsService;
import host.exp.exponent.notifications.ScopedCategoryAwareNotificationBuilder;
import host.exp.exponent.notifications.ScopedNotificationRequest;

public class ScopedExpoNotificationsService extends ExpoNotificationsService {
  @Override
  protected NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return (NotificationRequest) ScopedNotificationRequest.CREATOR.createFromParcel(parcel);
  }

  @Override
  protected Notification getNotification(expo.modules.notifications.notifications.model.Notification notification, NotificationBehavior behavior) {
    return new ScopedCategoryAwareNotificationBuilder(this, super.mStore)
      .setNotification(notification)
      .setAllowedBehavior(behavior)
      .build();
  }
}
