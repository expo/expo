package expo.modules.notifications.service.delegates

import android.content.Context
import com.google.firebase.messaging.RemoteMessage
import expo.modules.interfaces.taskManager.TaskServiceProviderHelper
import expo.modules.notifications.notifications.RemoteMessageSerializer
import expo.modules.notifications.notifications.background.BackgroundRemoteNotificationTaskConsumer
import expo.modules.notifications.notifications.debug.DebugLogging
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.model.RemoteNotificationContent
import expo.modules.notifications.notifications.model.triggers.FirebaseNotificationTrigger
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.FirebaseMessagingDelegate
import expo.modules.notifications.tokens.interfaces.FirebaseTokenListener
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

    /**
     * A weak map of task consumers -> reference. Used to check quickly whether given task
     * is already registered and to iterate over when notifying of new notification received
     * while the app is not in the foreground.
     */
    protected var sBackgroundTaskConsumerReferences = WeakHashMap<BackgroundRemoteNotificationTaskConsumer, WeakReference<BackgroundRemoteNotificationTaskConsumer>>()

    /**
     * Background tasks are registered in [BackgroundRemoteNotificationTaskConsumer] instances.
     *
     * @param taskConsumer A task instance to be executed when a notification is received while the * app is not in the foreground
     */
    fun addBackgroundTaskConsumer(taskConsumer: BackgroundRemoteNotificationTaskConsumer) {
      if (sBackgroundTaskConsumerReferences.containsKey(taskConsumer)) {
        return
      }
      sBackgroundTaskConsumerReferences[taskConsumer] = WeakReference(taskConsumer)
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

  private fun getBackgroundTasks() = sBackgroundTaskConsumerReferences.values.mapNotNull { it.get() }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    // the entry point for notifications. For its behavior, see table at https://firebase.google.com/docs/cloud-messaging/android/receive
    DebugLogging.logRemoteMessage("FirebaseMessagingDelegate.onMessageReceived: message", remoteMessage)
    val notification = createNotification(remoteMessage)
    DebugLogging.logNotification("FirebaseMessagingDelegate.onMessageReceived: notification", notification)
    NotificationsService.receive(context, notification)
    runTaskManagerTasks(remoteMessage)
  }

  private fun runTaskManagerTasks(remoteMessage: RemoteMessage) {
    // getTaskServiceImpl() has a side effect:
    // the TaskService constructor calls restoreTasks which then constructs a BackgroundRemoteNotificationTaskConsumer,
    // and the getBackgroundTasks() call below doesn't return an empty collection.
    TaskServiceProviderHelper.getTaskServiceImpl(context.applicationContext)
    getBackgroundTasks().forEach {
      it.executeTask(RemoteMessageSerializer.toBundle(remoteMessage))
    }
  }

  protected fun createNotification(remoteMessage: RemoteMessage): Notification {
    val identifier = getNotificationIdentifier(remoteMessage)

    val request = createNotificationRequest(identifier, RemoteNotificationContent(remoteMessage), FirebaseNotificationTrigger(remoteMessage))
    return Notification(request, Date(remoteMessage.sentTime))
  }

  /**
   * To match iOS behavior, we want to assign the remote message's tag as the notification ID.
   * If a notification comes in with the same tag as a notification that is already in the tray,
   * the existing notification is replaced, but the ID can remain constant.
   */
  protected fun getNotificationIdentifier(remoteMessage: RemoteMessage): String {
    return remoteMessage.data["tag"] ?: remoteMessage.messageId ?: UUID.randomUUID().toString()
  }

  protected open fun createNotificationRequest(
    identifier: String,
    content: INotificationContent,
    notificationTrigger: FirebaseNotificationTrigger
  ): NotificationRequest {
    return NotificationRequest(identifier, content, notificationTrigger)
  }

  override fun onDeletedMessages() {
    NotificationsService.handleDropped(context)
  }
}
