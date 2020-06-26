package expo.modules.notifications.tokens.interfaces;

/**
 * Interface used to register in {@link expo.modules.notifications.FirebaseListenerService}
 * and be notified of new device push tokens.
 */
public interface FirebaseTokenListener {
  /**
   * Callback called when new push token is generated.
   *
   * @param token New push token
   */
  void onNewToken(String token);
}
