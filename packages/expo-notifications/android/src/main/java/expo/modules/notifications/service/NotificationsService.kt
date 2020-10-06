package expo.modules.notifications.service

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

/**
 * Subclass of FirebaseMessagingService, central dispatcher for all the notifications-related actions.
 */
open class NotificationsService : FirebaseMessagingService() {
  protected open val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
    expo.modules.notifications.service.delegates.FirebaseMessagingDelegate(this)
  }
  override fun onMessageReceived(remoteMessage: RemoteMessage) = firebaseMessagingDelegate.onMessageReceived(remoteMessage)
  override fun onNewToken(token: String) = firebaseMessagingDelegate.onNewToken(token)
  override fun onDeletedMessages() = firebaseMessagingDelegate.onDeletedMessages()
}
