package expo.modules.notifications.service.interfaces

import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.NotificationsService

/**
 * A delegate to [NotificationsService] responsible for handling Firebase events.
 */
interface FirebaseMessagingDelegate {
  /**
   * Called on new token, dispatches it to [NotificationsService.sTokenListenersReferences].
   *
   * @param token New device push token.
   */
  fun onNewToken(token: String)

  fun onMessageReceived(remoteMessage: RemoteMessage)

  fun onDeletedMessages()
}
