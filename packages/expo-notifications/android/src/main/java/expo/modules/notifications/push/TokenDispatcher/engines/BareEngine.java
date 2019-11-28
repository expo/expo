package expo.modules.notifications.push.TokenDispatcher.engines;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.messaging.RemoteMessage;

import expo.modules.notifications.configuration.Configuration;

import static expo.modules.notifications.NotificationConstants.NOTIFICATION_APP_ID_KEY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_BODY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CATEGORY;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_CHANNEL_ID;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_DATA;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_ICON;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_REMOTE;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_SOUND;
import static expo.modules.notifications.NotificationConstants.NOTIFICATION_TITLE;

public class BareEngine implements Engine {
  @Override
  public void sendTokenToServer(String token, Context context) {
    //no-op
  }

  @Override
  public String generateToken(String appId, String token, Context context) {
    return token;
  }

  @Override
  public Bundle convertRemoteMessageToBundle(RemoteMessage remoteMessage) {
    Bundle bundle = new Bundle();
    String appId = remoteMessage.getData().get(NOTIFICATION_APP_ID_KEY);
    if (appId == null) {
      appId = Configuration.DEFAULT_APP_ID;
    }

    bundle.putString(NOTIFICATION_APP_ID_KEY, appId);
    bundle.putString(NOTIFICATION_CHANNEL_ID, remoteMessage.getData().get(NOTIFICATION_CHANNEL_ID));
    bundle.putString(NOTIFICATION_BODY, remoteMessage.getData().get(NOTIFICATION_BODY));
    bundle.putString(NOTIFICATION_TITLE, remoteMessage.getData().get(NOTIFICATION_TITLE));
    bundle.putString(NOTIFICATION_CATEGORY, remoteMessage.getData().get(NOTIFICATION_CATEGORY));
    bundle.putString(NOTIFICATION_ICON, remoteMessage.getData().get(NOTIFICATION_ICON));
    bundle.putString(NOTIFICATION_SOUND, remoteMessage.getData().get(NOTIFICATION_SOUND));
    bundle.putBoolean(NOTIFICATION_REMOTE, true);
    bundle.putString(NOTIFICATION_DATA, remoteMessage.getData().get(NOTIFICATION_DATA));

    return bundle;
  }
}
