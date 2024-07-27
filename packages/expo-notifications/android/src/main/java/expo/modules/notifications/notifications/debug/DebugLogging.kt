package expo.modules.notifications.notifications.debug

import android.os.Build
import android.os.Bundle
import android.util.Log
import androidx.annotation.RequiresApi
import com.google.firebase.messaging.RemoteMessage
import expo.modules.notifications.BuildConfig
import expo.modules.notifications.notifications.model.Notification
import java.util.function.Consumer

object DebugLogging {
  @JvmStatic
  val indents: List<String> = listOf("  ", "    ", "      ", "        ")

  @JvmStatic
  val maxIndex = 4

  @JvmStatic
  fun logBundle(caller: String, bundleToLog: Bundle) {
    if (!BuildConfig.DEBUG) {
      // Do not log in release/production builds
      return
    }
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) {
      return
    }
    Log.i("expo-notifications", "$caller:\n${bundleString(caller, bundleToLog, 0)}")
  }

  @RequiresApi(Build.VERSION_CODES.N)
  private fun bundleString(ignoredCaller: String, bundleToLog: Bundle, index: Int): String {
    if (index >= maxIndex) return ""
    return buildString {
      bundleToLog.keySet().forEach(
        Consumer { key: String ->
          val value = bundleToLog[key]
          if (value is Bundle) {
            append("${indents[index]}${key}\n")
            append(bundleString(ignoredCaller, value, index + 1))
          } else {
            val stringValue = value?.toString() ?: "(null)"
            append("${indents[index]}$key: $stringValue\n")
          }
        }
      )
    }
  }

  fun logRemoteMessage(caller: String, message: RemoteMessage) {
    if (!BuildConfig.DEBUG) {
      // Do not log for release/production builds
      return
    }
    Log.i("ReactNativeJS", "$caller:")
    Log.i("ReactNativeJS", "  notification.channelId: ${message.notification?.channelId}")
    Log.i("ReactNativeJS", "  notification.vibrateTimings: ${message.notification?.vibrateTimings?.contentToString()}")
    Log.i("ReactNativeJS", "  notification.body: ${message.notification?.body}")
    Log.i("ReactNativeJS", "  notification.color: ${message.notification?.color}")
    Log.i("ReactNativeJS", "  notification.sound: ${message.notification?.sound}")
    Log.i("ReactNativeJS", "  notification.title: ${message.notification?.title}")
    Log.i("ReactNativeJS", "  notification.collapseKey: ${message.collapseKey}")
    Log.i("ReactNativeJS", "  data: ${message.data}")
  }

  @RequiresApi(Build.VERSION_CODES.O)
  fun logNotification(caller: String, notification: Notification) {
    if (!BuildConfig.DEBUG) {
      // Do not log for release/production builds
      return
    }
    Log.i("ReactNativeJS", "$caller:")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.title: ${notification.notificationRequest.content.title}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.subtitle: ${notification.notificationRequest.content.subtitle}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.text: ${notification.notificationRequest.content.text}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.sound: ${notification.notificationRequest.content.sound}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.body: ${notification.notificationRequest.content.body}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.color: ${notification.notificationRequest.content.color}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.content.vibrationPattern: ${notification.notificationRequest.content.vibrationPattern.contentToString()}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.trigger.notificationChannel: ${notification.notificationRequest.trigger.notificationChannel}")
    Log.i("ReactNativeJS", "  notification.notificationRequest.identifier: ${notification.notificationRequest.identifier}")
  }
}
