package expo.modules.location.next.locationForegroundService

import android.app.Notification
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE
import androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC
import androidx.core.app.NotificationManagerCompat

private const val META_DATA_LOCATION_FOREGROUND_SERVICE_ICON = "expo.modules.location.foreground_service_icon"
private const val NOTIFICATION_CHANNEL_ID = "expo.location.next.notification.channel"

private fun resolveNotificationIcon(context: Context): Int {
  val packageName = context.packageName
  val metaData = runCatching {
    context.packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
  }.getOrNull()
  return metaData?.getInt(META_DATA_LOCATION_FOREGROUND_SERVICE_ICON, 0)?.takeIf { it != 0 }
    ?: context.resources.getIdentifier("notification_icon", "drawable", packageName).takeIf { it != 0 }
    ?: context.applicationInfo.icon.takeIf { it != 0 }
    ?: throw NoNotificationIconException()
}

private fun ensureNotificationChannel(context: Context, appName: String): String {
  val channel = NotificationChannelCompat
    .Builder(NOTIFICATION_CHANNEL_ID, NotificationManagerCompat.IMPORTANCE_LOW)
    .setName(appName)
    .setDescription("Location foreground service notification channel")
    .setShowBadge(false)
    .build()
  NotificationManagerCompat.from(context).createNotificationChannel(channel)
  return NOTIFICATION_CHANNEL_ID
}

internal fun buildNotification(context: Context, options: BackgroundSessionOptions): Notification {
  val packageManager = context.packageManager
  val packageName = context.packageName
  val appName = context.applicationInfo.loadLabel(packageManager).toString()

  val notificationBuilder = NotificationCompat
    .Builder(context, ensureNotificationChannel(context, appName))
    .setForegroundServiceBehavior(FOREGROUND_SERVICE_IMMEDIATE)
    .setSmallIcon(resolveNotificationIcon(context))
    .setVisibility(VISIBILITY_PUBLIC)
    .setContentTitle(options.notificationTitle ?: appName)
    .setOngoing(true)
    .setCategory(Notification.CATEGORY_SERVICE)
  options.notificationBody?.let { notificationBuilder.setContentText(it).setStyle(NotificationCompat.BigTextStyle().bigText(it)) }
  options.notificationColor?.let { notificationBuilder.setColorized(true).setColor(it) }

  packageManager.getLaunchIntentForPackage(packageName)?.let {
    it.flags = it.flags or Intent.FLAG_ACTIVITY_SINGLE_TOP
    val getActivityFlags = PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
    val contentIntent = PendingIntent.getActivity(context, 0, it, getActivityFlags)
    notificationBuilder.setContentIntent(contentIntent)
  }

  return notificationBuilder.build()
}
