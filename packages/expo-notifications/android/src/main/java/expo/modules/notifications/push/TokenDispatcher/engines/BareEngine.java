package expo.modules.notifications.push.TokenDispatcher.engines;

import android.content.Context;

public class BareEngine implements Engine {
  @Override
  public void sendTokenToServer(String token, Context context) {
    //no-op
  }

  @Override
  public String generateToken(String appId, String token, Context context) {
    return token;
  }
}
