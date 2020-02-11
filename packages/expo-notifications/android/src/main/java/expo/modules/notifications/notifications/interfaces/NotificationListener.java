package expo.modules.notifications.notifications.interfaces;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

/**
 * Interface used to register in {@link NotificationManager}
 * and be notified of new message events.
 */
public interface NotificationListener {
  /**
   * Callback called when new remote message is received.
   *
   * @param message Received message
   */
  void onMessage(RemoteMessage message);

  /**
   * Callback called when some pending messages are deleted.
   * See {@link FirebaseMessagingService#onDeletedMessages()}
   */
  void onDeletedMessages();
}
