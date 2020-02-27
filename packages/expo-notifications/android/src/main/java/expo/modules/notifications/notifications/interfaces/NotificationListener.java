package expo.modules.notifications.notifications.interfaces;

import com.google.firebase.messaging.FirebaseMessagingService;

import org.json.JSONObject;

/**
 * Interface used to register in {@link NotificationManager}
 * and be notified of new message events.
 */
public interface NotificationListener {
  /**
   * Callback called when new notification is received.
   *
   * @param identifier Notification identifier
   * @param request    Notification request
   * @param trigger    Notification trigger
   */
  void onNotificationReceived(String identifier, JSONObject request, NotificationTrigger trigger);

  /**
   * Callback called when some notifications are dropped.
   * See {@link FirebaseMessagingService#onDeletedMessages()}
   */
  void onNotificationsDropped();
}
