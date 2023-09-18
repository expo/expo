package expo.modules.notifications.notifications.emitting

import android.content.Context
import android.os.Bundle
import expo.modules.core.ExportedModule
import expo.modules.core.ModuleRegistry
import expo.modules.core.Promise
import expo.modules.core.interfaces.ExpoMethod
import expo.modules.core.interfaces.services.EventEmitter
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.interfaces.NotificationListener
import expo.modules.notifications.notifications.interfaces.NotificationManager
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse

private const val NEW_MESSAGE_EVENT_NAME = "onDidReceiveNotification"
private const val NEW_RESPONSE_EVENT_NAME = "onDidReceiveNotificationResponse"
private const val MESSAGES_DELETED_EVENT_NAME = "onNotificationsDeleted"

open class NotificationsEmitter(context: Context) : ExportedModule(context), NotificationListener {
  private lateinit var notificationManager: NotificationManager
  private var lastNotificationResponse: NotificationResponse? = null
  private var eventEmitter: EventEmitter? = null
  override fun getName(): String = "ExpoNotificationsEmitter"

  override fun onCreate(moduleRegistry: ModuleRegistry) {
    eventEmitter = moduleRegistry.getModule(EventEmitter::class.java)

    // Register the module as a listener in NotificationManager singleton module.
    // Deregistration happens in onDestroy callback.
    notificationManager = requireNotNull(moduleRegistry.getSingletonModule("NotificationManager", NotificationManager::class.java))
    notificationManager.addListener(this)
  }

  override fun onDestroy() {
    notificationManager.removeListener(this)
  }

  @ExpoMethod
  fun getLastNotificationResponseAsync(promise: Promise) {
    promise.resolve(lastNotificationResponse?.let(NotificationSerializer::toBundle))
  }

  /**
   * Callback called when [NotificationManager] gets notified of a new notification.
   * Emits a [NEW_MESSAGE_EVENT_NAME] event.
   *
   * @param notification Notification received
   */
  override fun onNotificationReceived(notification: Notification) {
    eventEmitter?.emit(NEW_MESSAGE_EVENT_NAME, NotificationSerializer.toBundle(notification))
  }

  /**
   * Callback called when [NotificationManager] gets notified of a new notification response.
   * Emits a [NEW_RESPONSE_EVENT_NAME] event.
   *
   * @param response Notification response received
   * @return Whether notification has been handled
   */
  override fun onNotificationResponseReceived(response: NotificationResponse): Boolean {
    lastNotificationResponse = response
    eventEmitter?.let {
      it.emit(NEW_RESPONSE_EVENT_NAME, NotificationSerializer.toBundle(response))
      return true
    }
    return false
  }

  /**
   * Callback called when [NotificationManager] gets informed of the fact of message dropping.
   * Emits a [MESSAGES_DELETED_EVENT_NAME] event.
   */
  override fun onNotificationsDropped() {
    eventEmitter?.emit(MESSAGES_DELETED_EVENT_NAME, Bundle.EMPTY)
  }
}
