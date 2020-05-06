package host.exp.exponent.fcm;

import com.google.firebase.messaging.RemoteMessage;

import expo.modules.notifications.FirebaseListenerService;
import host.exp.exponent.Constants;
import host.exp.exponent.notifications.PushNotificationHelper;

public class ExpoFcmMessagingService extends FirebaseListenerService {

  @Override
  public void onNewToken(String token) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    super.onNewToken(token);
    FcmRegistrationIntentService.registerForeground(getApplicationContext(), token);
  }

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    super.onMessageReceived(remoteMessage);
    PushNotificationHelper.getInstance().onMessageReceived(this, remoteMessage.getData().get("experienceId"), remoteMessage.getData().get("channelId"), remoteMessage.getData().get("message"), remoteMessage.getData().get("body"), remoteMessage.getData().get("title"), remoteMessage.getData().get("categoryId"));
  }
}
