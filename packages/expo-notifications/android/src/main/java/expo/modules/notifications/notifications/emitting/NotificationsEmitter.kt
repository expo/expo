package expo.modules.notifications.notifications.emitting

import android.os.Bundle
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.notifications.notifications.NotificationSerializer
import expo.modules.notifications.notifications.debug.DebugLogging
import expo.modules.notifications.notifications.interfaces.NotificationListener
import expo.modules.notifications.notifications.interfaces.NotificationManager
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse

private const val NEW_MESSAGE_EVENT_NAME = "onDidReceiveNotification"
private const val NEW_RESPONSE_EVENT_NAME = "onDidReceiveNotificationResponse"
private const val MESSAGES_DELETED_EVENT_NAME = "onNotificationsDeleted"

open class NotificationsEmitter : Module(), NotificationListener {
  private lateinit var notificationManager: NotificationManager
  private var lastNotificationResponseBundle: Bundle? = null

  override fun definition() = ModuleDefinition {
    Name("ExpoNotificationsEmitter")

    Events(
      "onDidReceiveNotification",
      "onNotificationsDeleted",
      "onDidReceiveNotificationResponse"
    )

    OnCreate {
      // Register the module as a listener in NotificationManager singleton module.
      // Deregistration happens in onDestroy callback.
      notificationManager = requireNotNull(appContext.legacyModuleRegistry.getSingletonModule("NotificationManager", NotificationManager::class.java))
      notificationManager.addListener(this@NotificationsEmitter)
    }

    OnDestroy {
      notificationManager.removeListener(this@NotificationsEmitter)
    }

    AsyncFunction<Bundle?>("getLastNotificationResponseAsync") {
      lastNotificationResponseBundle
    }

    AsyncFunction("clearLastNotificationResponseAsync") {
      lastNotificationResponseBundle = null
      null
    }
  }

  /**
   * Callback called when [NotificationManager] gets notified of a new notification.
   * Emits a [NEW_MESSAGE_EVENT_NAME] event.
   *
   * @param notification Notification received
   */
  override fun onNotificationReceived(notification: Notification) {
    val bundle = NotificationSerializer.toBundle(notification)
    DebugLogging.logBundle("NotificationsEmitter.onNotificationReceived", bundle)
    sendEvent(NEW_MESSAGE_EVENT_NAME, bundle)
  }

  /**
   * Callback called when [NotificationManager] gets notified of a new notification response.
   * Emits a [NEW_RESPONSE_EVENT_NAME] event.
   *
   * @param response Notification response received
   * @return Whether notification has been handled
   */
  override fun onNotificationResponseReceived(response: NotificationResponse): Boolean {
    val bundle = NotificationSerializer.toBundle(response)
    DebugLogging.logBundle("NotificationsEmitter.onNotificationResponseReceived", bundle)
    lastNotificationResponseBundle = bundle
    sendEvent(NEW_RESPONSE_EVENT_NAME, lastNotificationResponseBundle)
    return true
  }

  override fun onNotificationResponseIntentReceived(extras: Bundle?) {
    val bundle = NotificationSerializer.toResponseBundleFromExtras(extras)
    DebugLogging.logBundle("NotificationsEmitter.onNotificationResponseIntentReceived", bundle)
    lastNotificationResponseBundle = bundle
    sendEvent(NEW_RESPONSE_EVENT_NAME, lastNotificationResponseBundle)
  }

  /**
   * Callback called when [NotificationManager] gets informed of the fact of message dropping.
   * Emits a [MESSAGES_DELETED_EVENT_NAME] event.
   */
  override fun onNotificationsDropped() {
    sendEvent(MESSAGES_DELETED_EVENT_NAME, Bundle.EMPTY)
  }
}
