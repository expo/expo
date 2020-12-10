package expo.modules.notifications.service.delegates

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.notifications.JSONNotificationContentBuilder
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate
import expo.modules.notifications.tokens.interfaces.FirebaseTokenListener
import org.json.JSONObject
import java.lang.ref.WeakReference
import java.util.*

open class FirebaseMessagingDelegate(protected val context: Context) : FirebaseMessagingDelegate {
  companion object {
    // Unfortunately we cannot save state between instances of a service other way
    // than by static properties. Fortunately, using weak references we can
    // be somehow sure instances of PushTokenListeners won't be leaked by this component.
    /**
     * We store this value to be able to inform new listeners of last known token.
     */
    protected var sLastToken: String? = null

    /**
     * A weak map of listeners -> reference. Used to check quickly whether given listener
     * is already registered and to iterate over when notifying of new token.
     */
    protected val sTokenListenersReferences = WeakHashMap<FirebaseTokenListener, WeakReference<FirebaseTokenListener?>?>()

    /**
     * Used only by [FirebaseTokenListener] instances. If you look for a place to register
     * your listener, use [FirebaseTokenListener] singleton module.
     *
     * Purposefully the argument is expected to be a [FirebaseTokenListener] and just a listener.
     *
     * This class doesn't hold strong references to listeners, so you need to own your listeners.
     *
     * @param listener A listener instance to be informed of new push device tokens.
     */
    @JvmStatic
    fun addTokenListener(listener: FirebaseTokenListener) {
      // Checks whether this listener has already been registered
      if (!sTokenListenersReferences.containsKey(listener)) {
        sTokenListenersReferences[listener] = WeakReference(listener)
        // Since it's a new listener and we know of a last valid token, let's let them know.
        if (sLastToken != null) {
          listener.onNewToken(sLastToken)
        }
      }
    }
  }

  /**
   * Called on new token, dispatches it to [NotificationsService.sTokenListenersReferences].
   *
   * @param token New device push token.
   */
  override fun onNewToken(token: String) {
    for (listenerReference in sTokenListenersReferences.values) {
      listenerReference?.get()?.onNewToken(token)
    }
    sLastToken = token
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    NotificationsService.receive(context, createNotification(remoteMessage))
  }

  protected fun createNotification(remoteMessage: RemoteMessage): Notification {
    val identifier = remoteMessage.messageId ?: UUID.randomUUID().toString()
    val payload = JSONObject(remoteMessage.data as Map<*, *>)
    val content = JSONNotificationContentBuilder(context).setPayload(payload).build()
    val request = createNotificationRequest(identifier, content, FirebaseNotificationTrigger(remoteMessage))
    return Notification(request, Date(remoteMessage.sentTime))
  }

  protected open fun createNotificationRequest(
    identifier: String,
    content: NotificationContent,
    notificationTrigger: FirebaseNotificationTrigger
  ): NotificationRequest {
    return NotificationRequest(identifier, content, notificationTrigger)
  }

  override fun onDeletedMessages() {
    NotificationsService.handleDropped(context)
  }
}
