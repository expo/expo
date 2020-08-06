package host.exp.exponent.notifications.model;

import android.os.Parcel;

import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;
import expo.modules.notifications.notifications.model.NotificationRequest;

public class ScopedNotificationsReconstructor implements NotificationsReconstructor {

  @Override
  public NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return (NotificationRequest) ScopedNotificationRequest.CREATOR.createFromParcel(parcel);
  }

}
