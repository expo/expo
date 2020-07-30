package expo.modules.notifications.notifications.interfaces;

import android.os.Parcel;

import expo.modules.notifications.notifications.model.NotificationRequest;

public interface NotificationsReconstructor {

  NotificationRequest reconstructNotificationRequest(Parcel parcel);

}
