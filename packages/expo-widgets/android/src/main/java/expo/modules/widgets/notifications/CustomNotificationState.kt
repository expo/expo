package expo.modules.widgets.notifications

import android.app.Notification
import android.app.NotificationManager
import android.content.Context
import android.net.Uri
import android.os.Bundle
import android.service.notification.StatusBarNotification
import expo.modules.widgets.WidgetsJson

// Persisted in notification extras so handles and button presses work after a process restart.
internal data class CustomNotificationState(
  val name: String,
  val id: String,
  val props: Map<String, Any?>?,
  val options: CustomNotificationOptions
) {
  val tag: String get() = tag(name, id)

  fun toExtras(): Bundle = Bundle().apply {
    putString(EXTRA_NAME, name)
    putString(EXTRA_ID, id)
    props?.let { putString(EXTRA_PROPS, WidgetsJson.stringifyMap(it)) }
    putBundle(EXTRA_OPTIONS, options.toBundle())
  }

  companion object {
    private const val TAG_PREFIX = "expo_widgets_notification:"
    private const val EXTRA_NAME = "expo.modules.widgets.notification.NAME"
    private const val EXTRA_ID = "expo.modules.widgets.notification.ID"
    private const val EXTRA_PROPS = "expo.modules.widgets.notification.PROPS"
    private const val EXTRA_OPTIONS = "expo.modules.widgets.notification.OPTIONS"

    fun tag(name: String, id: String): String = "$TAG_PREFIX${Uri.encode(name)}:${Uri.encode(id)}"

    fun fromNotification(notification: Notification): CustomNotificationState? {
      val extras = notification.extras ?: return null
      val name = extras.getString(EXTRA_NAME) ?: return null
      val id = extras.getString(EXTRA_ID) ?: return null
      val props = extras.getString(EXTRA_PROPS)?.let { json ->
        runCatching { WidgetsJson.parseMap(json) }.getOrNull()
      }
      val options = extras.getBundle(EXTRA_OPTIONS)?.let(CustomNotificationOptions::fromBundle) ?: CustomNotificationOptions()
      return CustomNotificationState(name, id, props, options)
    }

    fun all(context: Context): List<CustomNotificationState> {
      return activeStatusBarNotifications(context)
        .filter { it.tag?.startsWith(TAG_PREFIX) == true }
        .mapNotNull { fromNotification(it.notification) }
    }

    fun find(context: Context, name: String, id: String): CustomNotificationState? {
      val tag = tag(name, id)
      return activeStatusBarNotifications(context)
        .firstOrNull { it.tag == tag }
        ?.let { fromNotification(it.notification) }
    }

    private fun activeStatusBarNotifications(context: Context): Array<StatusBarNotification> {
      val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
      return runCatching { manager.activeNotifications }.getOrDefault(emptyArray())
    }
  }
}
