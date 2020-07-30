package expo.modules.notifications.notifications.model;

import android.os.Parcel;

import expo.modules.notifications.notifications.interfaces.NotificationsReconstructor;

public class BareExpoNotificationsReconstructor implements NotificationsReconstructor {

  @Override
  public NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return NotificationRequest.CREATOR.createFromParcel(parcel);
  }
}
