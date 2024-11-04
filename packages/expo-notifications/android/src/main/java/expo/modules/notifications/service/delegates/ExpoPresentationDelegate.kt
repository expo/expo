package expo.modules.notifications.service.delegates

import android.app.NotificationManager
import android.content.Context
import android.media.RingtoneManager
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Parcel
import android.provider.Settings
import android.service.notification.StatusBarNotification
import android.util.Log
import android.util.Pair
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.notifications.notifications.SoundResolver
import expo.modules.notifications.notifications.enums.NotificationPriority
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior
import expo.modules.notifications.notifications.model.NotificationContent
import expo.modules.notifications.notifications.model.NotificationRequest
import expo.modules.notifications.notifications.presentation.builders.ExpoNotificationBuilder
import expo.modules.notifications.service.interfaces.PresentationDelegate
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import org.json.JSONException
import org.json.JSONObject
import java.util.Date

open class ExpoPresentationDelegate(
  protected val context: Context,
  private val notificationManager: NotificationManagerCompat = NotificationManagerCompat.from(context)
) : PresentationDelegate {

  companion object {
    protected const val ANDROID_NOTIFICATION_ID = 0

    protected const val INTERNAL_IDENTIFIER_SCHEME = "expo-notifications"
    protected const val INTERNAL_IDENTIFIER_AUTHORITY = "foreign_notifications"
    protected const val INTERNAL_IDENTIFIER_TAG_KEY = "tag"
    protected const val INTERNAL_IDENTIFIER_ID_KEY = "id"

    /**
     * Tries to parse given identifier as an internal foreign notification identifier
     * created by us in [getInternalIdentifierKey].
     *
     * @param identifier String identifier of the notification
     * @return Pair of (notification tag, notification id), if the identifier could be parsed. null otherwise.
     */
    fun parseNotificationIdentifier(identifier: String): Pair<String?, Int>? {
      try {
        val parsedIdentifier = Uri.parse(identifier)
        if (INTERNAL_IDENTIFIER_SCHEME == parsedIdentifier.scheme && INTERNAL_IDENTIFIER_AUTHORITY == parsedIdentifier.authority) {
          val tag = parsedIdentifier.getQueryParameter(INTERNAL_IDENTIFIER_TAG_KEY)
          val id = parsedIdentifier.getQueryParameter(INTERNAL_IDENTIFIER_ID_KEY)!!.toInt()
          return Pair(tag, id)
        }
      } catch (e: NullPointerException) {
        Log.e("expo-notifications", "Malformed foreign notification identifier: $identifier", e)
      } catch (e: NumberFormatException) {
        Log.e("expo-notifications", "Malformed foreign notification identifier: $identifier", e)
      } catch (e: UnsupportedOperationException) {
        Log.e("expo-notifications", "Malformed foreign notification identifier: $identifier", e)
      }
      return null
    }

    /**
     * Creates an identifier for given [StatusBarNotification]. It's supposed to be parsable
     * by [parseNotificationIdentifier].
     *
     * @param notification Notification to be identified
     * @return String identifier
     */
    protected fun getInternalIdentifierKey(notification: StatusBarNotification): String {
      return with(Uri.parse("$INTERNAL_IDENTIFIER_SCHEME://$INTERNAL_IDENTIFIER_AUTHORITY").buildUpon()) {
        notification.tag?.let {
          this.appendQueryParameter(INTERNAL_IDENTIFIER_TAG_KEY, it)
        }
        this.appendQueryParameter(INTERNAL_IDENTIFIER_ID_KEY, notification.id.toString())
        this.toString()
      }
    }
  }

  /**
   * Callback called to present the system UI for a notification.
   *
   * If the notification behavior is set to not show any alert,
   * we (may) play a sound, but then bail out early. You cannot
   * set badge count without showing a notification.
   */
  override fun presentNotification(notification: Notification, behavior: NotificationBehavior?) {
    if (behavior?.shouldShowAlert() == false) {
      if (behavior.shouldPlaySound()) {
        val sound = getNotificationSoundUri(notification) ?: Settings.System.DEFAULT_NOTIFICATION_URI
        RingtoneManager.getRingtone(
          context,
          sound
        ).play()
      }
      return
    }
    CoroutineScope(Dispatchers.IO).launch {
      val androidNotification = createNotification(notification, behavior)

      NotificationManagerCompat.from(context).notify(
        notification.notificationRequest.identifier,
        getNotifyId(notification.notificationRequest),
        androidNotification
      )
    }
  }

  private fun getNotificationSoundUri(notification: Notification): Uri? {
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      notification.notificationRequest.trigger.getNotificationChannel()?.let {
        notificationManager.getNotificationChannel(it)?.sound
      }
    } else {
      val name = notification.notificationRequest.content.soundName
      SoundResolver(context).resolve(name)
    }
  }

  protected open fun getNotifyId(request: NotificationRequest?): Int {
    return ANDROID_NOTIFICATION_ID
  }

  /**
   * Callback called to fetch a collection of currently displayed notifications.
   *
   * **Note:** This feature is only supported on Android 23+.
   *
   * @return A collection of currently displayed notifications.
   */
  override fun getAllPresentedNotifications(): Collection<Notification> {
    val notificationManager = (context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager)
    return notificationManager.activeNotifications.mapNotNull { getNotification(it) }
  }

  override fun dismissNotifications(identifiers: Collection<String>) {
    identifiers.forEach { identifier ->
      val foreignNotification = parseNotificationIdentifier(identifier)
      if (foreignNotification != null) {
        // Foreign notification identified by us
        NotificationManagerCompat.from(context).cancel(foreignNotification.first, foreignNotification.second)
      } else {
        // If the notification exists, let's assume it's ours, we have no reason to believe otherwise
        val existingNotification = this.getAllPresentedNotifications().find { it.notificationRequest.identifier == identifier }
        NotificationManagerCompat.from(context).cancel(identifier, getNotifyId(existingNotification?.notificationRequest))
      }
    }
  }

  override fun dismissAllNotifications() = NotificationManagerCompat.from(context).cancelAll()

  protected open suspend fun createNotification(notification: Notification, notificationBehavior: NotificationBehavior?): android.app.Notification =
    ExpoNotificationBuilder(context, notification, SharedPreferencesNotificationCategoriesStore(context)).apply {
      setAllowedBehavior(notificationBehavior)
    }.build()

  protected open fun getNotification(statusBarNotification: StatusBarNotification): Notification? {
    val notification = statusBarNotification.notification
    notification.extras.getByteArray(ExpoNotificationBuilder.EXTRAS_MARSHALLED_NOTIFICATION_REQUEST_KEY)?.let {
      try {
        with(Parcel.obtain()) {
          this.unmarshall(it, 0, it.size)
          this.setDataPosition(0)
          val request: NotificationRequest = NotificationRequest.CREATOR.createFromParcel(this)
          this.recycle()
          val notificationDate = Date(statusBarNotification.postTime)
          return Notification(request, notificationDate)
        }
      } catch (e: Exception) {
        // Let's catch all the exceptions -- there's nothing we can do here
        // and we'd rather return an array with a single, naively reconstructed notification
        // than throw an exception and return none.
        val message = "Could not have unmarshalled NotificationRequest from (${statusBarNotification.tag}, ${statusBarNotification.id})."
        Log.e("expo-notifications", message)
      }
    }

    // We weren't able to reconstruct the notification from our data, which means
    // it's either not our notification or we couldn't have unmarshaled it from
    // the byte array. Let's do what we can.
    val content = NotificationContent.Builder()
      .setTitle(NotificationCompat.getContentTitle(notification)?.toString())
      .setText(NotificationCompat.getContentText(notification)?.toString())
      .setSubtitle(NotificationCompat.getSubText(notification)?.toString())
      .setAutoDismiss(NotificationCompat.getAutoCancel(notification))
      .setSticky(NotificationCompat.getOngoing(notification))
      .setPriority(NotificationPriority.fromNativeValue(notification.priority)) // using deprecated field
      .setVibrationPattern(notification.vibrate) // using deprecated field
      .setSound(notification.sound)
      .setBody(fromBundle(notification.extras))
      .build()
    val request = NotificationRequest(getInternalIdentifierKey(statusBarNotification), content, null)
    return Notification(request, Date(statusBarNotification.postTime))
  }

  protected open fun fromBundle(bundle: Bundle): JSONObject {
    return JSONObject().also { json ->
      for (key in bundle.keySet()) {
        try {
          json.put(key, JSONObject.wrap(bundle[key]))
        } catch (e: JSONException) {
          // can't do anything about it apart from logging it
          Log.d("expo-notifications", "Error encountered while serializing Android notification extras: " + key + " -> " + bundle[key], e)
        }
      }
    }
  }
}
