package expo.modules.widgets.notifications

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Color
import android.net.Uri
import android.os.Build
import android.os.Bundle
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import expo.modules.widgets.R
import io.github.jakex7.peek.notification.PeekNotificationViews
import io.github.jakex7.peek.notification.setPeekContent

internal object CustomNotificationBuilder {
  private const val DEFAULT_CHANNEL_ID = "expo_widgets_notifications"

  // Meta-data written by the expo-notifications config plugin.
  private const val NOTIFICATIONS_DEFAULT_ICON_META_DATA = "expo.modules.notifications.default_notification_icon"
  private const val NOTIFICATIONS_DEFAULT_COLOR_META_DATA = "expo.modules.notifications.default_notification_color"

  fun build(
    context: Context,
    state: CustomNotificationState,
    views: PeekNotificationViews
  ): Notification {
    val options = state.options
    val channelId = resolveChannelId(context, options.channelId)
    val builder = NotificationCompat.Builder(context, channelId)
      .setSmallIcon(resolveSmallIcon(context, options.smallIcon))
      .setPeekContent(views, decorated = true, ongoing = options.ongoing)
      .setAutoCancel(options.autoCancel)
      .setOnlyAlertOnce(options.alertOnlyOnce)

    options.title?.let(builder::setContentTitle)
    options.text?.let(builder::setContentText)
    options.timeoutAfter?.let(builder::setTimeoutAfter)
    resolveColor(context, options.color)?.let { builder.color = it }
    contentIntent(context, state.tag, options.url)?.let(builder::setContentIntent)
    builder.addExtras(state.toExtras())

    return builder.build()
  }

  private fun resolveChannelId(context: Context, requestedChannelId: String?): String {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return requestedChannelId ?: DEFAULT_CHANNEL_ID
    }
    val manager = NotificationManagerCompat.from(context)
    if (requestedChannelId != null) {
      // Android silently drops notifications posted to an unknown channel.
      if (manager.getNotificationChannel(requestedChannelId) == null) {
        throw MissingNotificationChannelException(requestedChannelId)
      }
      return requestedChannelId
    }
    if (manager.getNotificationChannel(DEFAULT_CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(
          DEFAULT_CHANNEL_ID,
          context.getString(R.string.expo_widgets_notification_channel_name),
          NotificationManager.IMPORTANCE_LOW
        )
      )
    }
    return DEFAULT_CHANNEL_ID
  }

  private fun resolveSmallIcon(context: Context, name: String?): Int {
    if (name != null) {
      return context.resources.getIdentifier(name, "drawable", context.packageName).takeIf { it != 0 }
        ?: context.resources.getIdentifier(name, "mipmap", context.packageName).takeIf { it != 0 }
        ?: throw SmallIconNotFoundException(name)
    }
    applicationMetaData(context)?.getInt(NOTIFICATIONS_DEFAULT_ICON_META_DATA, 0)?.takeIf { it != 0 }?.let { return it }
    return context.applicationInfo.icon.takeIf { it != 0 } ?: android.R.drawable.sym_def_app_icon
  }

  private fun resolveColor(context: Context, color: String?): Int? {
    if (color != null) {
      return runCatching { Color.parseColor(color) }.getOrElse { throw InvalidNotificationColorException(color) }
    }
    val resourceId = applicationMetaData(context)?.getInt(NOTIFICATIONS_DEFAULT_COLOR_META_DATA, 0) ?: 0
    if (resourceId == 0) {
      return null
    }
    return runCatching { context.resources.getColor(resourceId, null) }.getOrNull()
  }

  private fun contentIntent(context: Context, tag: String, url: String?): PendingIntent? {
    val intent = if (url != null) {
      Intent(Intent.ACTION_VIEW, Uri.parse(url)).setPackage(context.packageName)
    } else {
      runCatching { context.packageManager.getLaunchIntentForPackage(context.packageName) }.getOrNull()
    } ?: return null
    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    return PendingIntent.getActivity(
      context,
      tag.hashCode(),
      intent,
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    )
  }

  @Suppress("DEPRECATION")
  private fun applicationMetaData(context: Context): Bundle? {
    return runCatching {
      context.packageManager.getApplicationInfo(context.packageName, PackageManager.GET_META_DATA).metaData
    }.getOrNull()
  }
}
