package expo.modules.notifications.service.delegates

import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import android.util.Log
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.ProcessLifecycleOwner
import expo.modules.notifications.notifications.NotificationManager
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationResponse
import expo.modules.notifications.service.NotificationForwarderActivity
import expo.modules.notifications.service.NotificationsService
import expo.modules.notifications.service.interfaces.HandlingDelegate
import java.lang.ref.WeakReference
import java.util.*

class ExpoHandlingDelegate(protected val context: Context) : HandlingDelegate {
  companion object {
    const val OPEN_APP_INTENT_ACTION = "expo.modules.notifications.OPEN_APP_ACTION"

    protected var sPendingNotificationResponses: MutableCollection<NotificationResponse> = ArrayList()

    /**
     * A weak map of listeners -> reference. Used to check quickly whether given listener
     * is already registered and to iterate over when notifying of new token.
     */
    protected var sListenersReferences = WeakHashMap<NotificationManager, WeakReference<NotificationManager>>()

    /**
     * Used only by [NotificationManager] instances. If you look for a place to register
     * your listener, use [NotificationManager] singleton module.
     *
     * Purposefully the argument is expected to be a [NotificationManager] and just a listener.
     *
     * This class doesn't hold strong references to listeners, so you need to own your listeners.
     *
     * @param listener A listener instance to be informed of new push device tokens.
     */
    fun addListener(listener: NotificationManager) {
      if (sListenersReferences.containsKey(listener)) {
        // Listener is already registered
        return
      }

      sListenersReferences[listener] = WeakReference(listener)
      if (!sPendingNotificationResponses.isEmpty()) {
        val responseIterator = sPendingNotificationResponses.iterator()
        while (responseIterator.hasNext()) {
          listener.onNotificationResponseReceived(responseIterator.next())
          responseIterator.remove()
        }
      }
    }

    /**
     * Create a PendingIntent to open app in foreground.
     * We actually start two Activities
     *   - the foreground main Activity
     *   - the background [NotificationForwarderActivity] Activity that send notification clicked events through broadcast
     */
    fun createPendingIntentForOpeningApp(context: Context, broadcastIntent: Intent, notificationResponse: NotificationResponse): PendingIntent {
      var intentFlags = PendingIntent.FLAG_UPDATE_CURRENT
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        // The intent may include `RemoteInput` from `TextInputNotificationAction`.
        // For intent with RemoteInput, it should be mutable.
        intentFlags = intentFlags or PendingIntent.FLAG_MUTABLE
      }

      val backgroundActivityIntent = Intent(context, NotificationForwarderActivity::class.java)
      backgroundActivityIntent.data = broadcastIntent.data
      backgroundActivityIntent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_MULTIPLE_TASK
      backgroundActivityIntent.putExtras(broadcastIntent)
      val requestCode = broadcastIntent.component?.className?.hashCode() ?: NotificationsService::class.java.hashCode()
      return PendingIntent.getActivity(context, requestCode, backgroundActivityIntent, intentFlags)
    }

    fun openAppToForeground(context: Context, notificationResponse: NotificationResponse) {
      (getNotificationActionLauncher(context) ?: getMainActivityLauncher(context))?.let { intent ->
        NotificationsService.setNotificationResponseToIntent(intent, notificationResponse)
        context.startActivity(intent)
        return
      }

      Log.w("expo-notifications", "No launch intent found for application. Interacting with the notification won't open the app. The implementation uses `getLaunchIntentForPackage` to find appropriate activity.")
    }

    private fun getNotificationActionLauncher(context: Context): Intent? {
      Intent(OPEN_APP_INTENT_ACTION).also { intent ->
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        intent.setPackage(context.applicationContext.packageName)
        context.packageManager.resolveActivity(intent, 0)?.let {
          return intent
        }
      }
      return null
    }

    private fun getMainActivityLauncher(context: Context) =
      context.packageManager.getLaunchIntentForPackage(context.packageName)
  }

  fun isAppInForeground() = ProcessLifecycleOwner.get().lifecycle.currentState.isAtLeast(Lifecycle.State.RESUMED)

  fun getListeners() = sListenersReferences.values.mapNotNull { it.get() }

  override fun handleNotification(notification: Notification) {
    if (isAppInForeground()) {
      getListeners().forEach {
        it.onNotificationReceived(notification)
      }
    } else if (notification.shouldPresent()) {
      NotificationsService.present(context, notification)
    }
  }

  /**
   * If the app is backgrounded, a notification is only presented if
   * the title and or text is present. If both are null or empty, this is a "data-only" or "silent"
   * notification that should not be presented to the user.
   */
  private fun Notification.shouldPresent(): Boolean {
    return !(notificationRequest.content.title.isNullOrEmpty() && notificationRequest.content.text.isNullOrEmpty())
  }

  override fun handleNotificationResponse(notificationResponse: NotificationResponse) {
    if (notificationResponse.action.opensAppToForeground()) {
      openAppToForeground(context, notificationResponse)
    }

    if (getListeners().isEmpty()) {
      sPendingNotificationResponses.add(notificationResponse)
    } else {
      getListeners().forEach {
        it.onNotificationResponseReceived(notificationResponse)
      }
    }
  }

  override fun handleNotificationsDropped() {
    getListeners().forEach {
      it.onNotificationsDropped()
    }
  }
}
