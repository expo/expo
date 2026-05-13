package expo.modules.notifications.notifications

import android.os.Bundle
import expo.modules.notifications.notifications.interfaces.NotificationListener
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.service.delegates.ExpoHandlingDelegate

object NotificationManager {
  /**
   * Set of registered listeners. Used to check quickly whether given listener
   * is already registered and to iterate over on new token.
   */
  private val listeners = mutableSetOf<NotificationListener>()
  private val pendingNotificationResponses = mutableListOf<NotificationResponse>()
  private val pendingNotificationResponsesFromExtras = mutableListOf<Bundle>()

  init {
    // TODO @vonovak there's a chain of listeners:
    //  ExpoHandlingDelegate -> NotificationManager -> NotificationsEmitter
    //                                              -> NotificationsHandler
    // it seems it could be shorter?
    // Registers this singleton instance in static ExpoHandlingDelegate listeners collection.
    // Since it doesn't hold strong reference to the object this should be safe.
    ExpoHandlingDelegate.addListener(this)
  }

  /**
   * Registers a [NotificationListener] by adding it to the [listeners] set.
   *
   * @param listener Listener to be notified of new messages.
   */
  fun addListener(listener: NotificationListener) {
    if (listeners.contains(listener)) {
      return
    }
    listeners.add(listener)
    if (pendingNotificationResponses.isNotEmpty()) {
      for (pendingResponse in pendingNotificationResponses) {
        listener.onNotificationResponseReceived(pendingResponse)
      }
    }
    if (pendingNotificationResponsesFromExtras.isNotEmpty()) {
      for (extras in pendingNotificationResponsesFromExtras) {
        listener.onNotificationResponseIntentReceived(extras)
      }
    }
  }

  /**
   * Unregisters a [NotificationListener] by removing it from the [listeners] set.
   *
   * @param listener Listener previously registered with [addListener].
   */
  fun removeListener(listener: NotificationListener) {
    listeners.remove(listener)
  }

  /**
   * Used by [expo.modules.notifications.service.delegates.ExpoSchedulingDelegate] to notify of new messages.
   * Calls [NotificationListener.onNotificationReceived] on all registered [listeners].
   *
   * In practice, that means calling [NotificationsEmitter] (just emits an event to JS) and
   * [NotificationsHandler] which calls `handleNotification` in JS to determine the behavior.
   * Then `SingleNotificationHandlerTask.processNotificationWithBehavior` may present it.
   *
   * @param notification Notification received
   */
  fun onNotificationReceived(notification: Notification) {
    for (listener in listeners) {
      listener.onNotificationReceived(notification)
    }
  }

  /**
   * Used by [expo.modules.notifications.service.delegates.ExpoSchedulingDelegate] to notify of new notification responses.
   * Calls [NotificationListener.onNotificationResponseReceived] on all registered [listeners].
   *
   * @param response Notification response received
   */
  fun onNotificationResponseReceived(response: NotificationResponse) {
    if (listeners.isEmpty()) {
      pendingNotificationResponses.add(response)
    } else {
      for (listener in listeners) {
        listener.onNotificationResponseReceived(response)
      }
    }
  }

  /**
   * Used by [expo.modules.notifications.service.delegates.ExpoSchedulingDelegate] to notify of message deletion event.
   * Calls [NotificationListener.onNotificationsDropped] on all registered [listeners].
   */
  fun onNotificationsDropped() {
    for (listener in listeners) {
      listener.onNotificationsDropped()
    }
  }

  fun onNotificationResponseFromExtras(extras: Bundle) {
    // We're going to be passed in extras from either
    // a killed state (ExpoNotificationLifecycleListener::onCreate)
    // OR a background state (ExpoNotificationLifecycleListener::onNewIntent)

    // If we've just come from a background state, we'll have listeners set up
    // - pass on the notification to them
    if (listeners.isNotEmpty()) {
      for (listener in listeners) {
        listener.onNotificationResponseIntentReceived(extras)
      }
    } else {
      // Otherwise, the app has been launched from a killed state, and our listeners
      // haven't yet been setup. We'll add this to a list of pending notifications
      // for them to process once they've been initialized.
      if (pendingNotificationResponsesFromExtras.isEmpty()) {
        pendingNotificationResponsesFromExtras.add(extras)
      }
    }
  }
}
