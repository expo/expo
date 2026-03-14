package expo.modules.notifications.service.delegates

import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
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
import expo.modules.notifications.notifications.model.NotificationBehaviorRecord
import expo.modules.notifications.notifications.model.Notification
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
    private const val GROUP_SUMMARY_TAG_SUFFIX = ":expo-group-summary"

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
  override fun presentNotification(notification: Notification, behavior: NotificationBehaviorRecord?) {
    if (behavior?.shouldPresentAlert == false) {
      if (behavior.shouldPlaySound) {
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
      val manager = NotificationManagerCompat.from(context)

      manager.notify(
        notification.notificationRequest.identifier,
        getNotifyId(notification.notificationRequest),
        androidNotification
      )

      notification.notificationRequest.content.group?.let { group ->
        postGroupSummaryIfNeeded(manager, group, androidNotification)
      }
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
   * Posts (or updates) a group summary notification so that Android visually
   * bundles all notifications sharing the same group key.
   */
  private fun postGroupSummaryIfNeeded(
    manager: NotificationManagerCompat,
    group: String,
    androidNotification: android.app.Notification
  ) {
    val channelId = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      androidNotification.channelId
    } else {
      null
    }

    val builder = if (channelId != null) {
      NotificationCompat.Builder(context, channelId)
    } else {
      NotificationCompat.Builder(context)
    }

    val summaryNotification = builder
      .setSmallIcon(getSmallIcon())
      .setGroup(group)
      .setGroupSummary(true)
      .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
      .setAutoCancel(true)
      .build()

    manager.notify("$group$GROUP_SUMMARY_TAG_SUFFIX", ANDROID_NOTIFICATION_ID, summaryNotification)
  }

  private fun getSmallIcon(): Int {
    try {
      val ai = context.packageManager.getApplicationInfo(
        context.packageName, PackageManager.GET_META_DATA
      )
      if (ai.metaData.containsKey(ExpoNotificationBuilder.META_DATA_DEFAULT_ICON_KEY)) {
        return ai.metaData.getInt(ExpoNotificationBuilder.META_DATA_DEFAULT_ICON_KEY)
      }
    } catch (e: Exception) {
      Log.e("expo-notifications", "Could not fetch default notification icon.", e)
    }
    return context.applicationInfo.icon
  }

  /**
   * Cancels group summary notifications whose groups no longer have any child notifications.
   */
  private fun cleanUpOrphanedGroupSummaries(manager: NotificationManagerCompat) {
    val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    val activeNotifications = nm.activeNotifications

    val summaryTags = activeNotifications
      .filter { it.tag?.endsWith(GROUP_SUMMARY_TAG_SUFFIX) == true }
      .map { it.tag!! }

    for (summaryTag in summaryTags) {
      val groupKey = summaryTag.removeSuffix(GROUP_SUMMARY_TAG_SUFFIX)
      val hasGroupMembers = activeNotifications.any {
        it.tag != summaryTag && it.notification?.group == groupKey
      }
      if (!hasGroupMembers) {
        manager.cancel(summaryTag, ANDROID_NOTIFICATION_ID)
      }
    }
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
    return notificationManager.activeNotifications
      .filter { it.tag?.endsWith(GROUP_SUMMARY_TAG_SUFFIX) != true }
      .mapNotNull { getNotification(it) }
  }

  override fun dismissNotifications(identifiers: Collection<String>) {
    val manager = NotificationManagerCompat.from(context)
    identifiers.forEach { identifier ->
      val foreignNotification = parseNotificationIdentifier(identifier)
      if (foreignNotification != null) {
        // Foreign notification identified by us
        manager.cancel(foreignNotification.first, foreignNotification.second)
      } else {
        // If the notification exists, let's assume it's ours, we have no reason to believe otherwise
        val existingNotification = this.getAllPresentedNotifications().find { it.notificationRequest.identifier == identifier }
        manager.cancel(identifier, getNotifyId(existingNotification?.notificationRequest))
      }
    }
    cleanUpOrphanedGroupSummaries(manager)
  }

  override fun dismissAllNotifications() = NotificationManagerCompat.from(context).cancelAll()

  protected open suspend fun createNotification(notification: Notification, notificationBehavior: NotificationBehaviorRecord?): android.app.Notification =
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
      .setGroup(NotificationCompat.getGroup(notification))
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
