package expo.modules.notifications.interfaces;

import android.os.Parcel;

public interface NotificationsReconstructor {

  NotificationRequest reconstructNotificationRequest(Parcel parcel);

  String getName();

}
