package expo.modules.notifications;

import android.os.Parcel;

import expo.modules.notifications.notifications.model.NotificationRequest;

public interface NotificationsReconstructor {

  NotificationRequest reconstructNotificationRequest(Parcel parcel);

}
