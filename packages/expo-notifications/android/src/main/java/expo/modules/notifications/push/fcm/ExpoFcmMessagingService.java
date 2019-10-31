package expo.modules.notifications.push.fcm;

import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import expo.modules.notifications.presenters.NotificationPresenterProvider;
import expo.modules.notifications.push.PushNotificationEngineProvider;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_BODY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CATEGORY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_COLOR;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_DATA;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_ICON;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_REMOTE;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_SOUND;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_TITLE;

public class ExpoFcmMessagingService extends FirebaseMessagingService {

  @Override
  public void onNewToken(String token) {
    Intent intent = new Intent(getApplicationContext(), ExpoIntentService.class);
    intent.putExtra("token", token);
    getApplicationContext().startService(intent);
  }

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    Bundle bundle = new Bundle();
    String appId = remoteMessage.getData().get(NOTIFICATION_APP_ID_KEY);

    if (appId == null) {
      appId = remoteMessage.getData().get("experienceId");
    }

    /*
      We do not scope here!!!
      Data have to be scoped on Expo sever or by user!
     */

    bundle.putString(NOTIFICATION_APP_ID_KEY, appId);
    bundle.putString(NOTIFICATION_CHANNEL_ID, remoteMessage.getData().get(NOTIFICATION_CHANNEL_ID));
    bundle.putString(NOTIFICATION_BODY, remoteMessage.getData().get("message"));
    bundle.putString(NOTIFICATION_TITLE, remoteMessage.getData().get(NOTIFICATION_TITLE));
    bundle.putString(NOTIFICATION_CATEGORY, remoteMessage.getData().get(NOTIFICATION_CATEGORY));
    bundle.putString(NOTIFICATION_ICON, remoteMessage.getData().get(NOTIFICATION_ICON));
    bundle.putString(NOTIFICATION_COLOR, remoteMessage.getData().get(NOTIFICATION_COLOR));
    bundle.putString(NOTIFICATION_DATA, remoteMessage.getData().get("body"));
    bundle.putString(NOTIFICATION_SOUND, remoteMessage.getData().get(NOTIFICATION_SOUND));
    bundle.putBoolean(NOTIFICATION_REMOTE, true);

    NotificationPresenterProvider.getNotificationPresenter().presentNotification(
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
