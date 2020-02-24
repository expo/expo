package expo.modules.notifications.notifications.interfaces;

/**
 * Interface of a singleton module responsible
 * for dispatching new remote message events to {@link NotificationListener}s.
 */
public interface NotificationManager {
  /**
   * Registers a {@link NotificationListener}.
   *
   * @param listener Listener to be notified of new message events.
   */
  void addListener(NotificationListener listener);

  /**
   * Unregisters a {@link NotificationListener}.
   *
   * @param listener Listener previously registered
   *                 with {@link NotificationManager#addListener(NotificationListener)}.
   */
  void removeListener(NotificationListener listener);
}
