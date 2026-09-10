package expo.modules.location.next

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationChannelCompat
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE
import androidx.core.app.NotificationCompat.VISIBILITY_PUBLIC
import androidx.core.app.NotificationManagerCompat
import androidx.core.app.ServiceCompat
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.types.Enumerable
import expo.modules.kotlin.types.OptimizedRecord
import kotlinx.coroutines.CompletableDeferred

class LocationForegroundService: Service() {
  override fun onBind(intent: Intent?): IBinder? {
    return null
  }

  override fun onDestroy() = synchronized(serviceLock) {
    super.onDestroy()
    isPromoted = false
    stopOnTaskRemovedOption = false
  }

  override fun onTaskRemoved(rootIntent: Intent?) = synchronized(serviceLock) {
    super.onTaskRemoved(rootIntent)
    if (stopOnTaskRemovedOption) {
      stopSelf()
    }
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int = synchronized(serviceLock) {
    val extrasBundle = intent?.extras
    if (extrasBundle == null) {
      stopSelfResult(startId)
      return START_NOT_STICKY
    }

    val promotionDeferred = servicePromotionDeferred
    try {
      val options = BackgroundSessionOptions.fromBundle(extrasBundle)
      val notification = buildNotification(this, options)
      ServiceCompat.startForeground(this, LOCATION_NOTIFICATION_ID, notification, FOREGROUND_SERVICE_TYPE_LOCATION)
      isPromoted = true
      promotionDeferred?.complete(ServicePromotionResult.Promoted)
      stopOnTaskRemovedOption = options.stopOnTaskRemoved
      servicePromotionDeferred = null
    } catch (t: Throwable) {
      if (stopSelfResult(startId)) {
        promotionDeferred?.complete(ServicePromotionResult.Failed(t))
        servicePromotionDeferred = null
      }
    }

    return START_NOT_STICKY
  }

  companion object {
    // Service callbacks (e.g. onStartCommand) can happen on different thread than other methods as they are invoked by the system on the main thread
    // and not the JS thread / AsyncFunctionQueue handler thread like the DSL methods. Use lock on operations that access the global state to disallow any races.
    private val serviceLock = Any()
    private const val LOCATION_NOTIFICATION_ID = 1492
    private const val META_DATA_LOCATION_FOREGROUND_SERVICE_ICON = "expo.modules.location.foreground_service_icon"
    private var servicePromotionDeferred: CompletableDeferred<ServicePromotionResult>? = null
    private var stopOnTaskRemovedOption: Boolean = false
    @Volatile private var isPromoted = false

    fun status(): BackgroundSessionStatus = synchronized(serviceLock) {
      val state = when {
        isPromoted -> BackgroundSessionState.PROMOTED
        servicePromotionDeferred != null -> BackgroundSessionState.PENDING
        else -> BackgroundSessionState.NOT_RUNNING
      }
      BackgroundSessionStatus(
        state,
        stopOnTaskRemovedOption,
        isBackgroundLocationUnthrottled()
      )
    }

    fun preRequestServicePromotion(): CompletableDeferred<ServicePromotionResult> = synchronized(serviceLock) {
      servicePromotionDeferred ?: CompletableDeferred<ServicePromotionResult>().also {
        if (isPromoted) {
          it.complete(ServicePromotionResult.Promoted)
        } else {
          servicePromotionDeferred = it
        }
      }
    }

    fun updateForegroundServiceIfPromoted(context: Context, options: BackgroundSessionOptions): Boolean = synchronized(serviceLock) {
      if (!isPromoted) {
        return false
      }
      val notification = buildNotification(context, options)
      NotificationManagerCompat.from(context).notify(LOCATION_NOTIFICATION_ID, notification)
      stopOnTaskRemovedOption = options.stopOnTaskRemoved
      return true
    }

    fun isBackgroundLocationUnthrottled(): Boolean =
      Build.VERSION.SDK_INT < Build.VERSION_CODES.O || isPromoted

    fun buildNotification(context: Context, options: BackgroundSessionOptions): Notification {
      val packageManager = context.packageManager
      val packageName = context.packageName
      val applicationInfo = context.applicationInfo
      val metaData = try {
        packageManager.getApplicationInfo(packageName, PackageManager.GET_META_DATA).metaData
      } catch (e: Exception) {
        null
      }
      val notificationIconId = metaData?.getInt(META_DATA_LOCATION_FOREGROUND_SERVICE_ICON, 0)?.takeIf { it != 0 }
        ?: context.resources.getIdentifier("notification_icon", "drawable", packageName).takeIf { it != 0 }
        ?: applicationInfo.icon.takeIf { it != 0 }
        ?: throw NoNotificationIconException()

      val channelID = "expo.location.next.notification.channel"
      val appName = applicationInfo.loadLabel(packageManager).toString()
      val channel = NotificationChannelCompat
        .Builder(channelID, NotificationManagerCompat.IMPORTANCE_LOW)
        .setName(appName)
        .setDescription("Location foreground service notification channel")
        .setShowBadge(false)
        .build()
      NotificationManagerCompat.from(context).createNotificationChannel(channel)

      val notificationBuilder =  NotificationCompat
        .Builder(context, channelID)
        .setForegroundServiceBehavior(FOREGROUND_SERVICE_IMMEDIATE)
        .setSmallIcon(notificationIconId)
        .setVisibility(VISIBILITY_PUBLIC)
        .setContentTitle(options.notificationTitle ?: appName)
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
  }
}

enum class BackgroundSessionState: Enumerable {
  NOT_RUNNING,
  PENDING,
  PROMOTED,
}

sealed interface ServicePromotionResult {
  data object Promoted: ServicePromotionResult
  data class Failed(val cause: Throwable): ServicePromotionResult
}

@OptimizedRecord
class BackgroundSessionStatus(
  @Field val state: BackgroundSessionState,
  @Field val stopOnTaskRemoved: Boolean,
  @Field val unthrottled: Boolean,
)
