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
import androidx.core.graphics.drawable.IconCompat
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
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONException
import org.json.JSONObject
import java.util.Date

open class ExpoPresentationDelegate(
  protected val context: Context,
  private val notificationManager: NotificationManagerCompat = NotificationManagerCompat.from(context)
) : PresentationDelegate {

  companion object {
    protected const val ANDROID_NOTIFICATION_ID = 0
    internal const val GROUP_SUMMARY_TAG_SUFFIX = ":expo-group-summary"

    // Keeps a summary's (tag, id) from colliding with user notifications, whose identifier becomes the tag
    internal val GROUP_SUMMARY_NOTIFICATION_ID = "expo-group-summary".hashCode()

    private fun isGroupSummary(notification: StatusBarNotification): Boolean =
      notification.notification.flags and android.app.Notification.FLAG_GROUP_SUMMARY != 0 &&
        notification.tag?.endsWith(GROUP_SUMMARY_TAG_SUFFIX) == true

    // Process-wide because delegate instances are short-lived (one per service intent)
    private val presentationMutex = Mutex()

    private const val SYSTEM_DISMISSAL_SETTLE_DELAY_MS = 1000L

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
      presentNotificationInternal(notification, behavior)
    }
  }

  internal suspend fun presentNotificationInternal(notification: Notification, behavior: NotificationBehaviorRecord?) {
    val androidNotification = createNotification(notification, behavior)

    // Cleanup reads an activeNotifications snapshot that lags in-flight notify()/cancel() calls,
    // so all mutations serialize on one lock, and cleanup runs before notify() — a later snapshot
    // could miss the in-flight post and cancel the fresh summary.
    presentationMutex.withLock {
      // runCatching: a throw would kill the process (unsupervised coroutine)
      runCatching { cleanUpOrphanedGroupSummaries() }
        .onFailure { Log.e("expo-notifications", "Failed to clean up group summary notifications.", it) }

      notificationManager.notify(
        notification.notificationRequest.identifier,
        getNotifyId(notification.notificationRequest),
        androidNotification
      )

      notification.notificationRequest.content.group?.let { group ->
        runCatching { postGroupSummary(group, androidNotification) }
          .onFailure { Log.e("expo-notifications", "Failed to post a group summary notification.", it) }
      }
    }
  }

  /**
   * Removes summaries orphaned by dismissals that bypass this delegate, such as a swipe or
   * a tap on an auto-cancel notification. Blocks its (background) thread: the caller's
   * broadcast lifecycle is what keeps a background-woken process alive until cleanup ran.
   */
  override fun removeOrphanedGroupSummaries() {
    val dismissalMayHaveOrphanedASummary = notificationManager.activeNotifications.any { isGroupSummary(it) }
    if (!dismissalMayHaveOrphanedASummary) {
      return
    }
    runBlocking {
      delay(SYSTEM_DISMISSAL_SETTLE_DELAY_MS)
      presentationMutex.withLock {
        runCatching { cleanUpOrphanedGroupSummaries() }
          .onFailure { Log.e("expo-notifications", "Failed to clean up group summary notifications.", it) }
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

  private fun postGroupSummary(group: String, childNotification: android.app.Notification) {
    // Accepted trade-off: the summary follows the last child's channel, so disabling
    // that channel stops the summary even if other children's channels stay enabled.
    val channelId = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      childNotification.channelId
    } else {
      null
    }

    val builder = if (channelId != null) {
      NotificationCompat.Builder(context, channelId)
    } else {
      NotificationCompat.Builder(context)
    }

    val childIcon = childNotification.smallIcon?.let { IconCompat.createFromIcon(context, it) }
    if (childIcon != null) {
      builder.setSmallIcon(childIcon)
    } else {
      builder.setSmallIcon(context.applicationInfo.icon)
    }

    val summaryNotification = builder
      .setGroup(group)
      .setGroupSummary(true)
      .setGroupAlertBehavior(NotificationCompat.GROUP_ALERT_CHILDREN)
      .build()

    notificationManager.notify("$group$GROUP_SUMMARY_TAG_SUFFIX", GROUP_SUMMARY_NOTIFICATION_ID, summaryNotification)
  }

  /**
   * @param cancelled (tag, id) pairs whose cancellation is in flight and may not be reflected
   * in [NotificationManager.getActiveNotifications] yet, because cancel() applies asynchronously.
   */
  private fun cleanUpOrphanedGroupSummaries(cancelled: Set<kotlin.Pair<String?, Int>> = emptySet()) {
    val activeNotifications = notificationManager.activeNotifications
      .filterNot { (it.tag to it.id) in cancelled }

    for (summary in activeNotifications.filter { isGroupSummary(it) }) {
      val groupKey = summary.notification.group ?: continue
      val hasGroupMembers = activeNotifications.any {
        !isGroupSummary(it) && it.notification.group == groupKey
      }
      if (!hasGroupMembers) {
        notificationManager.cancel(summary.tag, summary.id)
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
    return notificationManager.activeNotifications
      .filterNot { isGroupSummary(it) }
      .mapNotNull { getNotification(it) }
  }

  override fun dismissNotifications(identifiers: Collection<String>) = runBlocking {
    presentationMutex.withLock {
      val cancelled = mutableSetOf<kotlin.Pair<String?, Int>>()
      val presentedNotifications by lazy { getAllPresentedNotifications() }
      identifiers.forEach { identifier ->
        val foreignNotification = parseNotificationIdentifier(identifier)
        if (foreignNotification != null) {
          // Foreign notification identified by us
          notificationManager.cancel(foreignNotification.first, foreignNotification.second)
          cancelled.add(foreignNotification.first to foreignNotification.second)
        } else {
          // If the notification exists, let's assume it's ours, we have no reason to believe otherwise
          val existingNotification = presentedNotifications.find { it.notificationRequest.identifier == identifier }
          val notifyId = getNotifyId(existingNotification?.notificationRequest)
          notificationManager.cancel(identifier, notifyId)
          cancelled.add(identifier to notifyId)
        }
      }
      cleanUpOrphanedGroupSummaries(cancelled)
    }
  }

  override fun dismissAllNotifications() = runBlocking {
    presentationMutex.withLock {
      notificationManager.cancelAll()
    }
  }

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
        val message = "Could not unmarshall NotificationRequest from (${statusBarNotification.tag}, ${statusBarNotification.id})."
        Log.e("expo-notifications", message)
      }
    }

    // We weren't able to reconstruct the notification from our data, which means
    // it's either not our notification or we couldn't unmarshal it from
    // the byte array. Let's do what we can.
    val content = NotificationContent.Builder()
      .setTitle(NotificationCompat.getContentTitle(notification)?.toString())
      .setText(NotificationCompat.getContentText(notification)?.toString())
      .setSubtitle(NotificationCompat.getSubText(notification)?.toString())
      .setAutoDismiss(NotificationCompat.getAutoCancel(notification))
      .setSticky(NotificationCompat.getOngoing(notification))
      // GROUP_KEY_SILENT is assigned by androidx to silent notifications with no group of
      // their own — don't surface it as a threadIdentifier the developer never set.
      .setGroup(NotificationCompat.getGroup(notification)?.takeIf { it != NotificationCompat.GROUP_KEY_SILENT })
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
