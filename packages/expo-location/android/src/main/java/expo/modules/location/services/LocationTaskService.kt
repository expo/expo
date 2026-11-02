package expo.modules.location.services

import android.annotation.TargetApi
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Intent
import android.graphics.Color
import android.os.Binder
import android.os.Build
import android.os.Bundle
import android.os.IBinder
import android.util.Log

class LocationTaskService : Service() {
  private var mChannelId: String? = null
  private var mKillService = false
  private val mServiceId = sServiceId++
  private val mBinder: IBinder = ServiceBinder()

  var isPromoted = false
    private set

  inner class ServiceBinder : Binder() {
    val service: LocationTaskService
      get() = this@LocationTaskService
  }

  override fun onBind(intent: Intent): IBinder {
    return mBinder
  }

  @TargetApi(26)
  override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
    val extras = intent.extras
    if (extras != null) {
      mChannelId = extras.getString("appId") + ":" + extras.getString("taskName")
      mKillService = extras.getBoolean("killService", false)
      extras.getBundle("serviceOptions")?.let {
        try {
          startForeground(it)
        } catch (e: RuntimeException) {
          if (!isStartRejected(e)) {
            throw e
          }
          Log.w(TAG, "Foreground location service could not enter the foreground", e)
          stop()
        }
      }
    }
    return START_REDELIVER_INTENT
  }

  fun stop() {
    stopForeground(STOP_FOREGROUND_REMOVE)
    stopSelf()
  }

  override fun onDestroy() {
    isPromoted = false
    super.onDestroy()
  }

  override fun onTaskRemoved(rootIntent: Intent) {
    if (mKillService) {
      super.onTaskRemoved(rootIntent)
      stop()
    }
  }

  fun startForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    startForeground(mServiceId, notification)
    isPromoted = true
  }

  //region private
  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle): Notification {
    prepareChannel(mChannelId)
    val builder = Notification.Builder(this, mChannelId)
    val title = serviceOptions.getString("notificationTitle")
    val body = serviceOptions.getString("notificationBody")
    val color = colorStringToInteger(serviceOptions.getString("notificationColor"))

    title?.let { builder.setContentTitle(title) }
    body?.let { builder.setContentText(body) }
    color?.let {
      builder.setColorized(true).setColor(color)
    } ?: run {
      builder.setColorized(false)
    }

    packageManager.getLaunchIntentForPackage(packageName)?.let {
      it.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
      // We're defaulting to the behaviour prior API 31 (mutable) even though Android recommends immutability
      val mutableFlag = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        PendingIntent.FLAG_MUTABLE
      } else {
        0
      }
      val contentIntent = PendingIntent.getActivity(this, 0, it, PendingIntent.FLAG_UPDATE_CURRENT or mutableFlag)
      builder.setContentIntent(contentIntent)
    }

    val iconsResId = try {
      val ai = packageManager.getApplicationInfo(
        packageName,
        android.content.pm.PackageManager.GET_META_DATA
      )
      if (ai.metaData?.containsKey(META_DATA_FOREGROUND_SERVICE_ICON_KEY) == true) {
        ai.metaData.getInt(META_DATA_FOREGROUND_SERVICE_ICON_KEY)
      } else {
        getDefaultNotificationIcon()
      }
    } catch (e: Exception) {
      Log.e(TAG, "Could not fetch default notification icon.", e)
      getDefaultNotificationIcon()
    }

    return builder.setCategory(Notification.CATEGORY_SERVICE)
      .setSmallIcon(iconsResId)
      .build()
  }

  @TargetApi(26)
  private fun prepareChannel(id: String?) {
    val notificationManager = getSystemService(NOTIFICATION_SERVICE) as? NotificationManager
      ?: return
    val appName = applicationInfo.loadLabel(packageManager).toString()
    var channel = notificationManager.getNotificationChannel(id)
    if (channel == null) {
      channel = NotificationChannel(id, appName, NotificationManager.IMPORTANCE_LOW)
      channel.description = "Background location notification channel"
      notificationManager.createNotificationChannel(channel)
    }
  }

  /**
   * Returns the best available notification icon resource ID.
   * Prefers the `notification_icon` drawable (configured via expo notifications config plugin) over `applicationInfo.icon`. The launcher icon is
   * full-color and renders as a solid white square in notifications, since Android
   * requires small notification icons to be monochrome.
   */
  private fun getDefaultNotificationIcon(): Int {
    return resources.getIdentifier("notification_icon", "drawable", packageName)
      .takeIf { it != 0 } ?: applicationInfo.icon
  }

  private fun colorStringToInteger(color: String?): Int? {
    return try {
      Color.parseColor(color)
    } catch (e: Exception) {
      null
    }
  } //endregion

  companion object {
    private const val TAG = "LocationTaskService"
    private var sServiceId = 481756
    const val META_DATA_FOREGROUND_SERVICE_ICON_KEY: String =
      "expo.modules.location.foreground_service_icon"

    // ForegroundServiceStartNotAllowedException and BackgroundServiceStartNotAllowedException are IllegalStateExceptions.
    internal fun isStartRejected(e: RuntimeException): Boolean {
      return e is SecurityException || e is IllegalStateException
    }
  }
}
