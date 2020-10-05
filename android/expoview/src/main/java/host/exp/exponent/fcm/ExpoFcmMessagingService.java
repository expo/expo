package host.exp.exponent.fcm;


import android.annotation.SuppressLint;

import expo.modules.notifications.service.NotificationsService;

@SuppressLint("MissingFirebaseInstanceTokenRefresh")
public class ExpoFcmMessagingService extends NotificationsService {
  public ExpoFcmMessagingService() {
    super(new ExpoFirebaseMessagingDelegate());
  }
}
