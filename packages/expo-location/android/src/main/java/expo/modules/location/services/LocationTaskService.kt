package expo.modules.location.services

import android.os.IBinder
import android.content.Intent
import android.annotation.TargetApi
import android.os.Bundle
import android.app.PendingIntent
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.graphics.Color
import android.os.Binder
import android.util.Log
import java.lang.Exception

class LocationTaskService : Service() {
  private var channelId: String? = null
  private lateinit var parentContext: Context
  private val mServiceId = sServiceId++
  private val mBinder: IBinder = ServiceBinder()

  inner class ServiceBinder : Binder() {
    val service: LocationTaskService
      get() = this@LocationTaskService
  }

  override fun onBind(intent: Intent): IBinder {
    Log.w(TAG, "onBind")
    return mBinder
  }

  @TargetApi(26)
  override fun onStartCommand(intent: Intent, flags: Int, startId: Int): Int {
    val extras = intent.extras
    if (extras != null) {
      channelId = extras.getString("appId") + ":" + extras.getString("taskName")
    }
    return START_REDELIVER_INTENT
  }

  fun setParentContext(context: Context) {
    // Background location logic is still outside LocationTaskService,
    // so we have to save parent context in order to make sure it won't be destroyed by the OS.
    parentContext = context
  }

  fun stop() {
    stopForeground(true)
    stopSelf()
  }

  override fun onTaskRemoved(rootIntent: Intent) {
    super.onTaskRemoved(rootIntent)
    stop()
  }

  fun startForeground(serviceOptions: Bundle) {
    val notification = buildServiceNotification(serviceOptions)
    startForeground(mServiceId, notification)
  }

  //region private
  @TargetApi(26)
  private fun buildServiceNotification(serviceOptions: Bundle) =
    Notification.Builder(this, channelId).apply {
      prepareChannel(channelId)
      val title = serviceOptions.getString("notificationTitle")
      val body = serviceOptions.getString("notificationBody")
      val color = colorStringToInteger(serviceOptions.getString("notificationColor"))
      if (title != null) {
        setContentTitle(title)
      }
      if (body != null) {
        setContentText(body)
      }
      if (color != null) {
        setColorized(true).setColor(color)
      } else {
        setColorized(false)
      }
      if (::parentContext.isInitialized) {
        val intent = parentContext.packageManager.getLaunchIntentForPackage(
          parentContext.packageName
        )
        if (intent != null) {
          intent.flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
          val contentIntent = PendingIntent.getActivity(
            this@LocationTaskService,
            0,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT
          )
          setContentIntent(contentIntent)
        }
      }
      setCategory(Notification.CATEGORY_SERVICE)
      setSmallIcon(applicationInfo.icon)
    }.build()

  @TargetApi(26)
  private fun prepareChannel(id: String?) {
    val notificationManager =
      getSystemService(NOTIFICATION_SERVICE) as? NotificationManager ?: return
    val appName = applicationInfo.loadLabel(packageManager).toString()
    var channel = notificationManager.getNotificationChannel(id)
    if (channel == null) {
      channel = NotificationChannel(id, appName, NotificationManager.IMPORTANCE_LOW)
      channel.description = "Background location notification channel"
      notificationManager.createNotificationChannel(channel)
    }
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
  }
}
