package host.exp.exponent.notifications;

import android.os.Parcel;

import expo.modules.notifications.NotificationsReconstructor;
import expo.modules.notifications.notifications.model.NotificationRequest;

public class ScopedExpoNotificationsReconstructor implements NotificationsReconstructor {

  @Override
  public NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return (NotificationRequest) ScopedNotificationRequest.CREATOR.createFromParcel(parcel);
  }

}
