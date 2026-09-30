package expo.modules.notifications.notifications

import android.content.Context
import android.content.pm.PackageManager
import expo.modules.notifications.notifications.interfaces.INotificationContent

internal const val META_DATA_PRESENT_DATA_ONLY_KEY = "expo.modules.notifications.present_data_only_notifications_with_title"

private const val PENDING_WARNING_PREFERENCES_NAME = "expo.modules.notifications.PendingDataOnlyPresentationWarning"
private const val PENDING_WARNING_KEY = "pending"

private const val LEARN_MORE = "Learn more: https://docs.expo.dev/push-notifications/what-you-need-to-know/#headless-background-notifications"
private const val SEND_NOTIFICATION_MESSAGE = "To show a notification, send a Notification Message instead (use the Expo Push Service, or set `android.notification` in the FCM request)."
private const val USE_TASK = "To run code first, handle the message in a task registered with `registerTaskAsync` and call `scheduleNotificationAsync`."

/**
 * A data-only FCM message with a title or text in `data` is presented by expo-notifications only
 * when the app is not in the foreground. A notification with neither is silent.
 */
internal fun INotificationContent.hasTitleOrText() = !(title.isNullOrEmpty() && text.isNullOrEmpty())

internal enum class DataOnlyPresentationSetting {
  UNSET,
  ENABLED,
  DISABLED;

  val shouldPresent: Boolean get() = this != DISABLED

  fun deprecationWarning(presented: Boolean): String? {
    val firstSentence = if (presented) {
      "expo-notifications presented a notification from a data-only FCM message because its `data` contains `title` or `message`"
    } else {
      "expo-notifications received a data-only FCM message whose `data` contains `title` or `message`. " +
        "It was not presented because the app is in the foreground; " +
        "on Android, such messages are presented only when the app is not in the foreground."
    }
    return when (this) {
      UNSET -> {
        val opening = if (presented) "$firstSentence. This happens only on Android, and only when the app is not in the foreground." else firstSentence
        "$opening This behavior is deprecated: in SDK 59 these messages will no longer be presented by default. " +
          "$SEND_NOTIFICATION_MESSAGE $USE_TASK " +
          "To adopt the new behavior now, set `presentDataOnlyNotificationsWithTitle: false` in the expo-notifications config plugin. " +
          LEARN_MORE
      }
      ENABLED -> {
        val opening = if (presented) "$firstSentence, and `presentDataOnlyNotificationsWithTitle` is `true`." else firstSentence
        "$opening This option will be removed in SDK 60, and these messages will then no longer be presented. " +
          "$SEND_NOTIFICATION_MESSAGE $USE_TASK " +
          LEARN_MORE
      }
      DISABLED -> null
    }
  }

  companion object {
    fun fromMetaDataValue(value: Boolean?) = when (value) {
      null -> UNSET
      true -> ENABLED
      false -> DISABLED
    }

    fun read(context: Context): DataOnlyPresentationSetting = try {
      val metaData = context.packageManager
        .getApplicationInfo(context.packageName, PackageManager.GET_META_DATA)
        .metaData
      fromMetaDataValue(
        if (metaData.containsKey(META_DATA_PRESENT_DATA_ONLY_KEY)) metaData.getBoolean(META_DATA_PRESENT_DATA_ONLY_KEY) else null
      )
    } catch (e: Exception) {
      UNSET
    }
  }
}

/**
 * Presenting happens in the background, possibly before JS runs, so the warning is stored
 * and shown in JS the next time the notifications handler starts observing.
 */
internal class PendingDataOnlyPresentationWarning(context: Context) {
  private val preferences = context.getSharedPreferences(PENDING_WARNING_PREFERENCES_NAME, Context.MODE_PRIVATE)

  fun record() {
    preferences.edit().putBoolean(PENDING_WARNING_KEY, true).apply()
  }

  fun consume(): Boolean {
    val pending = preferences.getBoolean(PENDING_WARNING_KEY, false)
    if (pending) {
      preferences.edit().remove(PENDING_WARNING_KEY).apply()
    }
    return pending
  }
}
