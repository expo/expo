package host.exp.exponent.fcm;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import host.exp.exponent.Constants;
import host.exp.exponent.notifications.PushNotificationHelper;

public class ExpoFcmMessagingService extends FirebaseMessagingService {

  @Override
  public void onNewToken(String token) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    FcmRegistrationIntentService.registerForeground(getApplicationContext(), token);
  }

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    PushNotificationHelper.getInstance().onMessageReceived(this, remoteMessage.getData().get("experienceId"), remoteMessage.getData().get("channelId"), remoteMessage.getData().get("message"), remoteMessage.getData().get("body"), remoteMessage.getData().get("title"));
  }
}
