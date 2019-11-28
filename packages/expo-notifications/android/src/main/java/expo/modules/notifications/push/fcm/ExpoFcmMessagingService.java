package expo.modules.notifications.push.fcm;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import expo.modules.notifications.displayers.NotificationDisplayerProvider;
import expo.modules.notifications.push.PushNotificationEngineProvider;
import expo.modules.notifications.push.TokenDispatcher.engines.Engine;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;

public class ExpoFcmMessagingService extends FirebaseMessagingService {

  @Override
  public void onNewToken(String token) {
    Intent intent = new Intent(getApplicationContext(), ExpoIntentService.class);
    intent.putExtra("token", token);
    getApplicationContext().startService(intent);
  }

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    Engine engine = PushNotificationEngineProvider.getPushNotificationEngine(getApplicationContext());
    Bundle bundle = engine.convertRemoteMessageToBundle(remoteMessage);
    String appId = bundle.getString(NOTIFICATION_APP_ID_KEY);

    NotificationDisplayerProvider.getNotificationDisplayer().displayNotification(
      this.getApplicationContext(),
      appId,
      bundle
    );
  }

  public void setContext(Context context) {
    try {
      this.attachBaseContext(context);
    } catch (Exception e) {
      // no op
    }
  }
}
