package expo.modules.notifications.service

import android.content.Intent
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate

/**
 * Subclass of FirebaseMessagingService, central dispatcher for all the notifications-related actions.
 */
open class NotificationsService : FirebaseMessagingService() {
  companion object {
    const val NOTIFICATION_EVENT_ACTION = "expo.modules.notifications.NOTIFICATION_EVENT"
  }

  protected open val firebaseMessagingDelegate: FirebaseMessagingDelegate by lazy {
    expo.modules.notifications.service.delegates.FirebaseMessagingDelegate(this)
  }
  override fun getStartCommandIntent(intent: Intent?): Intent {
    if (intent?.action === NOTIFICATION_EVENT_ACTION) {
      return intent
    }
    return super.getStartCommandIntent(intent)
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) = firebaseMessagingDelegate.onMessageReceived(remoteMessage)
  override fun onNewToken(token: String) = firebaseMessagingDelegate.onNewToken(token)
  override fun onDeletedMessages() = firebaseMessagingDelegate.onDeletedMessages()
}
