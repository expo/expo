package expo.modules.notifications.tokens.interfaces;

/**
 * Interface of a singleton module responsible
 * for dispatching new push token information to listeners.
 */
public interface PushTokenManager {
  /**
   * Registers a {@link PushTokenListener}.
   *
   * @param listener Listener to be notified of new device push tokens.
   */
  void addListener(PushTokenListener listener);

  /**
   * Unregisters a {@link PushTokenListener}.
   *
   * @param listener Listener previously registered
   *                 with {@link PushTokenManager#addListener(PushTokenListener)}.
   */
  void removeListener(PushTokenListener listener);
}
