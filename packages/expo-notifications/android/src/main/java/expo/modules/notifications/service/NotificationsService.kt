package expo.modules.notifications.service

import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

/**
 * Subclass of FirebaseMessagingService, central dispatcher for all the notifications-related actions.
 */
open class NotificationsService(
  private val firebaseMessagingDelegate: FirebaseMessagingDelegate = expo.modules.notifications.service.delegates.FirebaseMessagingDelegate()
) : FirebaseMessagingService() {
  override fun onMessageReceived(remoteMessage: RemoteMessage) = firebaseMessagingDelegate.onMessageReceived(this, remoteMessage)
  override fun onNewToken(token: String) = firebaseMessagingDelegate.onNewToken(this, token)
  override fun onDeletedMessages() = firebaseMessagingDelegate.onDeletedMessages(this)
}
