package expo.modules.notifications.push.TokenDispatcher;

public interface TokenDispatcher {

  void onNewToken(String token, Runnable continuation);

  void registerForTokenChange(String appId, OnTokenChangeListener onTokenChangeListener);

  void unregister(String appId);

}
