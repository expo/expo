package expo.modules.notifications.service.interfaces

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.service.NotificationsService

interface FirebaseMessagingDelegate {
  /**
   * Called on new token, dispatches it to [NotificationsService.sTokenListenersReferences].
   *
   * @param token New device push token.
   */
  fun onNewToken(context: Context, token: String)

  fun onMessageReceived(context: Context, remoteMessage: RemoteMessage)

  fun onDeletedMessages(context: Context)
}
