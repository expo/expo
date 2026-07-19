package expo.modules.notifications.tokens.interfaces

/**
 * Interface used to register in [NotificationsService]
 * and be notified of new device push tokens.
 */
interface FirebaseTokenListener {
  /**
   * Callback called when new push token is generated.
   *
   * @param token New push token
   */
  fun onNewToken(token: String)
}
