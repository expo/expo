package expo.modules.notifications.push.TokenDispatcher.engines;

import android.content.Context;

public interface Engine {

  void sendTokenToServer(String token, Context context);

  String generateToken(String appId, String token, Context context);

}
