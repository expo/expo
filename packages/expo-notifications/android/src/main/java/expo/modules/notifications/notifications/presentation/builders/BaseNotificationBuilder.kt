package expo.modules.notifications.notifications.presentation.builders

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import android.util.Log
import androidx.annotation.RequiresApi
import androidx.core.app.NotificationCompat
import expo.modules.notifications.R
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelGroupManager
import expo.modules.notifications.notifications.channels.managers.AndroidXNotificationsChannelManager
import expo.modules.notifications.notifications.channels.managers.NotificationsChannelManager
import expo.modules.notifications.notifications.interfaces.INotificationContent
import expo.modules.notifications.notifications.interfaces.NotificationBuilder
import expo.modules.notifications.notifications.model.Notification
import expo.modules.notifications.notifications.model.NotificationBehavior

/**
 * A foundation class for [NotificationBuilder] implementations. Takes care
 * of accepting [.mNotification] and [.mNotificationBehavior].
 */
abstract class BaseNotificationBuilder protected constructor(protected val context: Context, protected val notification: Notification) :
  NotificationBuilder {

  protected var notificationBehavior: NotificationBehavior? = null
    private set

  override fun setAllowedBehavior(behavior: NotificationBehavior?): NotificationBuilder {
    notificationBehavior = behavior
    return this
  }

  fun createBuilder(): NotificationCompat.Builder {
    val builder = channelId?.let { NotificationCompat.Builder(context, it) } ?: NotificationCompat.Builder(context)
    return builder
  }

  protected val channelId: String?
    /**
     * @return A [NotificationChannel]'s identifier to use for the notification.
     */
    get() {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        // Returning null on incompatible platforms won't be an error.
        return null
      }

      val trigger = notification.notificationRequest?.trigger
      if (trigger == null) {
        Log.e(
          "notifications",
          String.format(
            "Couldn't get channel for the notifications - trigger is 'null'. Fallback to '%s' channel",
            FALLBACK_CHANNEL_ID
          )
        )
        return fallbackNotificationChannel!!.id
      }

      val requestedChannelId = trigger.getNotificationChannel()
        ?: return fallbackNotificationChannel!!.id

      val channelForRequestedId =
        notificationsChannelManager.getNotificationChannel(requestedChannelId)
      if (channelForRequestedId == null) {
        Log.e(
          "notifications",
          String.format(
            "Channel '%s' doesn't exists. Fallback to '%s' channel",
            requestedChannelId,
            FALLBACK_CHANNEL_ID
          )
        )
        return fallbackNotificationChannel!!.id
      }

      return channelForRequestedId.id
    }

  open val notificationsChannelManager: NotificationsChannelManager
    get() = AndroidXNotificationsChannelManager(
      context,
      AndroidXNotificationsChannelGroupManager(context)
    )

  private val fallbackNotificationChannel: NotificationChannel?
    /**
     * Fetches the fallback notification channel, and if it doesn't exist yet - creates it.
     *
     *
     * Returns null on [NotificationChannel]-incompatible platforms.
     *
     * @return Fallback [NotificationChannel] or null.
     */
    get() {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
        return null
      }

      val channel = notificationManager.getNotificationChannel(FALLBACK_CHANNEL_ID)
      return channel ?: createFallbackChannel()
    }

  /**
   * Creates a fallback channel of [.FALLBACK_CHANNEL_ID] ID, name fetched
   * from Android resources ([.getFallbackChannelName]
   * and importance set by [.FALLBACK_CHANNEL_IMPORTANCE].
   *
   * @return Newly created channel.
   */
  @RequiresApi(api = Build.VERSION_CODES.O)
  protected fun createFallbackChannel(): NotificationChannel {
    val channel = NotificationChannel(
      FALLBACK_CHANNEL_ID,
      fallbackChannelName,
      FALLBACK_CHANNEL_IMPORTANCE
    )
    channel.setShowBadge(true)
    channel.enableVibration(true)
    notificationManager.createNotificationChannel(channel)
    return channel
  }

  private val fallbackChannelName: String
    /**
     * Fetches fallback channel name from Android resources. Overridable by Android resources system
     *
     * @return Name of the fallback channel
     */
    get() = context.getString(R.string.expo_notifications_fallback_channel_name)

  private val notificationManager: NotificationManager
    get() = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  companion object {
    private const val FALLBACK_CHANNEL_ID = "expo_notifications_fallback_notification_channel"

    // Behaviors we will want to impose on received notifications include
    // being displayed as a heads-up notification. For that we will need
    // a channel of high importance.
    @RequiresApi(api = Build.VERSION_CODES.N)
    private val FALLBACK_CHANNEL_IMPORTANCE = NotificationManager.IMPORTANCE_HIGH
  }

  protected val notificationContent: INotificationContent
    get() = notification.notificationRequest.content
}
