package expo.modules.notifications.push.TokenDispatcher;

import android.content.Context;
import android.content.SharedPreferences;

import java.util.HashMap;

import expo.modules.notifications.push.TokenDispatcher.engines.Engine;

class SimpleTokenDispatcher implements TokenDispatcher {

  private SharedPreferences sharedPreferences;
  private Engine mEngine;
  private HashMap<String, OnTokenChangeListener> listeners = new HashMap<>();
  private Context mContext = null;

  SimpleTokenDispatcher(Context context, Engine engine) {
    sharedPreferences = context.getSharedPreferences(SimpleTokenDispatcher.class.getCanonicalName(), Context.MODE_PRIVATE);
    mContext = context;
    mEngine = engine;
  }

  @Override
  public void onNewToken(String token, Runnable continuation) {
    String lastToken = sharedPreferences.getString("token", null);
    if (!(token == null) && !token.equals(lastToken)) {
      SharedPreferences.Editor editor = sharedPreferences.edit();
      editor.putString("token", token);
      editor.commit();

      mEngine.sendTokenToServer(token, mContext);

      for (String key : listeners.keySet()) {
        OnTokenChangeListener listener = listeners.get(key);
        listener.onTokenChange(mEngine.generateToken(key, token, mContext));
      }
    }
  }

  @Override
  public void registerForTokenChange(String appId, OnTokenChangeListener onTokenChangeListener) {
    String currentToken = sharedPreferences.getString("token", null);
    String lastTokenSendToApp = sharedPreferences.getString(appId, null);

    if (!(currentToken == null) && !currentToken.equals(lastTokenSendToApp)) {
      SharedPreferences.Editor editor = sharedPreferences.edit();
      editor.putString(appId, currentToken);
      editor.commit();
      onTokenChangeListener.onTokenChange(mEngine.generateToken(appId, currentToken, mContext));
    }

    listeners.put(appId, onTokenChangeListener);
  }

  @Override
  public void unregister(String appId) {
    listeners.remove(appId);
  }

}
