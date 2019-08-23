package host.exp.exponent.fcm;

import android.content.Context;
import android.content.Intent;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import host.exp.exponent.Constants;
import host.exp.exponent.notifications.PushNotificationHelper;

import static host.exp.exponent.fcm.ExpoFirebaseEventDispatcher.MESSAGE_KEY;
import static host.exp.exponent.fcm.ExpoFirebaseEventDispatcher.METHOD_KEY;
import static host.exp.exponent.fcm.ExpoFirebaseEventDispatcher.ON_NEW_MESSAGE;
import static host.exp.exponent.fcm.ExpoFirebaseEventDispatcher.ON_NEW_TOKEN;
import static host.exp.exponent.fcm.ExpoFirebaseEventDispatcher.TOKEN_KEY;

public class ExpoFcmMessagingService extends FirebaseMessagingService {

  @Override
  public void onNewToken(String token) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    Intent intent = new Intent(getApplicationContext(), ExpoFirebaseEventDispatcher.class);
    intent.putExtra(TOKEN_KEY, token);
    intent.putExtra(METHOD_KEY, ON_NEW_TOKEN);
    getApplicationContext().startService(intent);
  }

  @Override
  public void onMessageReceived(RemoteMessage remoteMessage) {
    if (!Constants.FCM_ENABLED) {
      return;
    }

    Intent intent = new Intent(getApplicationContext(), ExpoFirebaseEventDispatcher.class);
    intent.putExtra(MESSAGE_KEY, remoteMessage.toIntent().getExtras());
    intent.putExtra(METHOD_KEY, ON_NEW_MESSAGE);
    getApplicationContext().startService(intent);

  }
}
