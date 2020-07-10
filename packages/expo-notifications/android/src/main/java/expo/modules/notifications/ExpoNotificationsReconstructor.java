package expo.modules.notifications;

import android.os.Parcel;

import expo.modules.notifications.notifications.model.NotificationRequest;

public class ExpoNotificationsReconstructor implements NotificationsReconstructor {

  @Override
  public NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return NotificationRequest.CREATOR.createFromParcel(parcel);
  }

}
