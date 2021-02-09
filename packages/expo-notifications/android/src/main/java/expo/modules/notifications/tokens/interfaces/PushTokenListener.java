package expo.modules.notifications.tokens.interfaces;

/**
 * Interface used to register in {@link PushTokenManager}
 * and be notified of new device push tokens.
 */
public interface PushTokenListener {
  /**
   * Callback called when new push token is generated.
   *
   * @param token New push token
   */
  void onNewToken(String token);
}
