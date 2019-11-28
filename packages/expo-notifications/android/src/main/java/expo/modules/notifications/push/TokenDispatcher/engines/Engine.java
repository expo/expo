package expo.modules.notifications.push.TokenDispatcher.engines;

import android.content.Context;
import android.os.Bundle;

import com.google.firebase.messaging.RemoteMessage;

public interface Engine {

  void sendTokenToServer(String token, Context context);

  String generateToken(String appId, String token, Context context);

  Bundle convertRemoteMessageToBundle(RemoteMessage remoteMessage);

}
