package expo.modules.notifications;

import android.os.Parcel;

import expo.modules.notifications.interfaces.NotificationRequest;
import expo.modules.notifications.interfaces.NotificationsReconstructor;

public class ExpoNotificationsReconstructor implements NotificationsReconstructor {

  @Override
  public NotificationRequest reconstructNotificationRequest(Parcel parcel) {
    return (NotificationRequest) NotificationRequest.CREATOR.createFromParcel(parcel);
  }

  @Override
  public String getName() {
    return "bare";
  }
}
