package expo.modules.notifications.tokens.interfaces;

import expo.modules.notifications.service.NotificationsService;

/**
 * Interface used to register in {@link NotificationsService}
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
