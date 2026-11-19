package expo.modules.notifications.service.delegates

import android.content.Context
import android.os.Bundle
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
import java.util.*
import java.util.concurrent.CopyOnWriteArraySet

open class FirebaseMessagingDelegate(protected val context: Context) : FirebaseMessagingDelegate {
  companion object {
    // Unfortunately we cannot save state between instances of a service other way
    // than by static properties.
    private val sTokenListeners = CopyOnWriteArraySet<(String) -> Unit>()

    /**
     * Registers a listener to be informed of new device push tokens.
     * Make sure to also unregister it with [removeTokenListener].
     */
    @JvmStatic
    fun addTokenListener(listener: (String) -> Unit) {
      sTokenListeners.add(listener)
    }

    @JvmStatic
    fun removeTokenListener(listener: (String) -> Unit) {
      sTokenListeners.remove(listener)
    }

    /**
     * A set of background task consumers, notified when a notification is received
     * while the app is not in the foreground.
     */
    protected var sBackgroundTaskConsumers = mutableSetOf<BackgroundRemoteNotificationTaskConsumer>()

    /**
     * Background tasks are registered in [BackgroundRemoteNotificationTaskConsumer] instances.
     *
     * @param taskConsumer A task instance to be executed when a notification is received while the app is not in the foreground
     */
    fun addBackgroundTaskConsumer(taskConsumer: BackgroundRemoteNotificationTaskConsumer) {
      sBackgroundTaskConsumers.add(taskConsumer)
    }

    fun removeBackgroundTaskConsumer(taskConsumer: BackgroundRemoteNotificationTaskConsumer) {
      sBackgroundTaskConsumers.remove(taskConsumer)
    }

    fun getBackgroundTasks(): List<BackgroundRemoteNotificationTaskConsumer> = sBackgroundTaskConsumers.toList()

    fun runTaskManagerTasks(applicationContext: Context, bundle: Bundle) {
      // getTaskServiceImpl() has a side effect:
      // the TaskService constructor calls restoreTasks which then constructs a BackgroundRemoteNotificationTaskConsumer,
      // and the getBackgroundTasks() call below doesn't return an empty collection.
      TaskServiceProviderHelper.getTaskServiceImpl(applicationContext)
      getBackgroundTasks().forEach {
        it.executeTask(bundle)
      }
    }
  }

  /**
   * Called on new token, dispatches it to the registered token listeners.
   *
   * @param token New device push token.
   */
  override fun onNewToken(token: String) {
    sTokenListeners.forEach { it(token) }
  }

  override fun onMessageReceived(remoteMessage: RemoteMessage) {
    // the entry point for notifications. For its behavior, see table at https://firebase.google.com/docs/cloud-messaging/android/receive
    DebugLogging.logRemoteMessage("FirebaseMessagingDelegate.onMessageReceived: message", remoteMessage)
    val notification = createNotification(remoteMessage)
    DebugLogging.logNotification("FirebaseMessagingDelegate.onMessageReceived: notification", notification)
    NotificationsService.receive(context, notification)
    runTaskManagerTasks(context.applicationContext, RemoteMessageSerializer.toBundle(remoteMessage))
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
